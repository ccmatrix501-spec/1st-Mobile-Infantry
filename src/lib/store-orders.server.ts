import { randomUUID } from "node:crypto";
import type {
  StoreCompletedOrderInput,
  StoreOrder,
  StoreOrderAddress,
  StoreOrderCustomer,
  StoreOrderItem,
  StoreOrderStatus,
} from "@/lib/store-orders";

const DEFAULT_SITE_URL = "https://1stmid.com";
const NOTIFY_TIMEOUT_MS = 7_000;

const STORE_ORDER_STATUSES: StoreOrderStatus[] = [
  "paid",
  "packing",
  "shipped",
  "completed",
  "cancelled",
];

type StoreOrderRow = {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal: string | number;
  shipping_amount: string | number;
  total: string | number;
  shipping_method: string;
  customer: StoreOrderCustomer | string;
  shipping_address: StoreOrderAddress | string;
  items: StoreOrderItem[] | string;
  payment_provider: string;
  payment_reference: string;
  placed_at: Date | string;
  updated_at: Date | string;
  discord_notified: boolean;
  discord_notified_at: Date | string | null;
  discord_error: string | null;
};

type NotificationOptions = {
  test?: boolean;
};

function asJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function iso(value: Date | string | null): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function toOrder(row: StoreOrderRow): StoreOrder {
  const status = STORE_ORDER_STATUSES.includes(row.status as StoreOrderStatus)
    ? (row.status as StoreOrderStatus)
    : "paid";
  return {
    id: row.id,
    orderNumber: row.order_number,
    status,
    currency: row.currency,
    subtotal: Number(row.subtotal) || 0,
    shippingAmount: Number(row.shipping_amount) || 0,
    total: Number(row.total) || 0,
    shippingMethod: row.shipping_method,
    customer: asJson(row.customer),
    shippingAddress: asJson(row.shipping_address),
    items: asJson(row.items),
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference,
    placedAt: iso(row.placed_at) || new Date().toISOString(),
    updatedAt: iso(row.updated_at) || new Date().toISOString(),
    discordNotified: row.discord_notified === true,
    discordNotifiedAt: iso(row.discord_notified_at),
    discordError: row.discord_error,
  };
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function cleanMoney(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

function cleanQuantity(value: unknown): number {
  const number = Math.floor(Number(value));
  return Number.isFinite(number) ? Math.max(1, Math.min(999, number)) : 1;
}

function normaliseCompletedOrder(input: StoreCompletedOrderInput): StoreCompletedOrderInput {
  const currency = cleanText(input.currency, 8).toUpperCase() || "AUD";
  const customer: StoreOrderCustomer = {
    firstName: cleanText(input.customer?.firstName, 100),
    lastName: cleanText(input.customer?.lastName, 100),
    email: cleanText(input.customer?.email, 220),
    phone: cleanText(input.customer?.phone, 80),
    discordName: cleanText(input.customer?.discordName, 120) || undefined,
  };
  const shippingAddress: StoreOrderAddress = {
    address: cleanText(input.shippingAddress?.address, 300),
    city: cleanText(input.shippingAddress?.city, 120),
    state: cleanText(input.shippingAddress?.state, 120),
    postalCode: cleanText(input.shippingAddress?.postalCode, 40),
    country: cleanText(input.shippingAddress?.country, 120),
  };
  const items: StoreOrderItem[] = Array.isArray(input.items)
    ? input.items.slice(0, 100).map((item) => ({
        productId: cleanText(item.productId, 160),
        productName: cleanText(item.productName, 180) || "Store item",
        variantName: cleanText(item.variantName, 180) || undefined,
        quantity: cleanQuantity(item.quantity),
        unitPrice: cleanMoney(item.unitPrice),
        lineTotal: cleanMoney(item.lineTotal),
      }))
    : [];

  if (!customer.firstName || !customer.lastName || !customer.email) {
    throw new Error("Completed order is missing required customer details.");
  }
  if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.country) {
    throw new Error("Completed order is missing the shipping address.");
  }
  if (!items.length) throw new Error("Completed order has no items.");

  const paymentProvider = cleanText(input.paymentProvider, 80);
  const paymentReference = cleanText(input.paymentReference, 240);
  if (!paymentProvider || !paymentReference) {
    throw new Error("Completed order requires a payment provider and payment reference.");
  }

  return {
    currency,
    subtotal: cleanMoney(input.subtotal),
    shippingAmount: cleanMoney(input.shippingAmount),
    total: cleanMoney(input.total),
    shippingMethod: cleanText(input.shippingMethod, 100) || "Shipping",
    customer,
    shippingAddress,
    items,
    paymentProvider,
    paymentReference,
  };
}

function getSiteUrl(): string {
  const configured =
    process.env.STORE_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  if (/^https?:\/\//i.test(configured)) return configured.replace(/\/$/, "");
  return `https://${configured.replace(/\/$/, "")}`;
}

function getDiscordWebhookUrl(): string {
  return process.env.STORE_DISCORD_WEBHOOK_URL?.trim() || "";
}

function getBotBaseUrl(): string {
  const configured =
    process.env.STORE_ORDER_BOT_URL?.trim() ||
    process.env.STORE_BOT_URL?.trim() ||
    "";
  if (!configured) return "";
  const base = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return base.replace(/\/$/, "");
}

function getBotSecret(): string {
  return (
    process.env.STORE_ORDER_API_SECRET?.trim() ||
    process.env.STORE_BOT_ORDER_SECRET?.trim() ||
    ""
  );
}

export function storeOrderBotConfigured(): boolean {
  return Boolean(getBotBaseUrl() && getBotSecret());
}

export function storeOrderDiscordConfigured(): boolean {
  return storeOrderBotConfigured() || Boolean(getDiscordWebhookUrl());
}

export function storeOrderNotificationMode(): "bot-forum" | "webhook" | "none" {
  if (storeOrderBotConfigured()) return "bot-forum";
  if (getDiscordWebhookUrl()) return "webhook";
  return "none";
}

export function storeOrderSiteUrl(): string {
  return getSiteUrl();
}

function orderNumber(): string {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();
  return `MI-${day}-${suffix}`;
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.getSql();
}

async function ensureOrdersTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_orders (
      id text primary key,
      order_number text not null unique,
      status text not null default 'paid',
      currency text not null,
      subtotal numeric(12, 2) not null,
      shipping_amount numeric(12, 2) not null,
      total numeric(12, 2) not null,
      shipping_method text not null,
      customer jsonb not null,
      shipping_address jsonb not null,
      items jsonb not null,
      payment_provider text not null,
      payment_reference text not null,
      placed_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      discord_notified boolean not null default false,
      discord_notified_at timestamptz,
      discord_error text
    )
  `);
  await sql.query(`
    create unique index if not exists store_orders_payment_reference_idx
      on store_orders (payment_provider, payment_reference)
  `);
  await sql.query(`
    create index if not exists store_orders_placed_at_idx
      on store_orders (placed_at desc)
  `);
  return sql;
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(amount);
  } catch {
    return `${currency || "AUD"} ${amount.toFixed(2)}`;
  }
}

function clamp(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function discordItemSummary(order: StoreOrder): string {
  const lines = order.items.map((item) => {
    const option = item.variantName ? ` — ${item.variantName}` : "";
    return `• **${clamp(item.productName, 90)}**${option} × ${item.quantity} — ${money(item.lineTotal, order.currency)}`;
  });
  return clamp(lines.join("\n"), 1000) || "No item summary available.";
}

function discordDestination(order: StoreOrder): string {
  const parts = [
    order.shippingAddress.city,
    order.shippingAddress.state,
    order.shippingAddress.country,
  ].filter(Boolean);
  return parts.join(", ") || "See admin order page";
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function postBot(path: string, payload: unknown): Promise<void> {
  const base = getBotBaseUrl();
  const secret = getBotSecret();
  if (!base || !secret) throw new Error("Store order bot bridge is not configured.");

  const response = await fetchWithTimeout(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "1st-Mobile-Infantry-Store/1.0",
      "X-Store-Order-Secret": secret,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: string };
      detail = body?.error ? ` ${body.error}` : "";
    } catch {
      // Ignore non-JSON error response.
    }
    throw new Error(`Store order bot returned HTTP ${response.status}.${detail}`);
  }
}

async function postDiscordPayload(payload: unknown): Promise<void> {
  const webhookUrl = getDiscordWebhookUrl();
  if (!webhookUrl) {
    throw new Error("STORE_DISCORD_WEBHOOK_URL is not configured.");
  }

  const response = await fetchWithTimeout(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "1st-Mobile-Infantry-Store/1.0",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Discord webhook returned HTTP ${response.status}.`);
  }
}

function discordOrderPayload(order: StoreOrder, options: NotificationOptions = {}) {
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const adminUrl = `${getSiteUrl()}/leadership-store/orders/${encodeURIComponent(order.id)}`;
  const discordLine = order.customer.discordName
    ? `\nDiscord: **${clamp(order.customer.discordName, 100)}**`
    : "";

  return {
    username: "1st M.I. Store Orders",
    avatar_url: `${getSiteUrl()}/mi-emblem.jpg`,
    content: options.test ? "**TEST PURCHASE — no payment was taken.**" : undefined,
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: `${options.test ? "TEST • " : ""}New Store Order • ${order.orderNumber}`,
        url: adminUrl,
        description: options.test
          ? "This is a leadership test purchase. It was recorded only to test the store order and Discord notification flow."
          : "A paid store order has been recorded. The card below keeps private details brief; open the secure admin order page for the full shipping address and contact information.",
        color: 3329895,
        fields: [
          {
            name: "Customer",
            value: `**${clamp(customerName, 150)}**${discordLine}`,
            inline: true,
          },
          {
            name: "Order Total",
            value: `**${money(order.total, order.currency)}**\n${order.shippingMethod}: ${money(order.shippingAmount, order.currency)}`,
            inline: true,
          },
          {
            name: "Destination",
            value: clamp(discordDestination(order), 300),
            inline: true,
          },
          {
            name: "Items",
            value: discordItemSummary(order),
            inline: false,
          },
          {
            name: "Payment",
            value: `${clamp(order.paymentProvider, 70)}\nReference: ${clamp(order.paymentReference, 170)}`,
            inline: true,
          },
          {
            name: "Admin Details",
            value: `[Open full order details](${adminUrl})`,
            inline: true,
          },
        ],
        footer: {
          text: options.test
            ? "1st M.I. Quartermaster • TEST ORDER"
            : "1st M.I. Quartermaster • Admin order notification",
        },
        timestamp: order.placedAt,
      },
    ],
  };
}

export async function sendStoreOrderDiscordNotification(
  order: StoreOrder,
  options: NotificationOptions = {},
): Promise<void> {
  if (storeOrderBotConfigured()) {
    await postBot("/store-orders/notify", { order, test: options.test === true });
    return;
  }
  await postDiscordPayload(discordOrderPayload(order, options));
}

async function markDiscordResult(
  orderId: string,
  notified: boolean,
  error: string | null,
): Promise<void> {
  const sql = await ensureOrdersTable();
  await sql.query(
    `update store_orders
        set discord_notified = $2,
            discord_notified_at = case when $2 then now() else discord_notified_at end,
            discord_error = $3,
            updated_at = now()
      where id = $1`,
    [orderId, notified, error],
  );
}

export async function recordCompletedStoreOrder(
  rawInput: StoreCompletedOrderInput,
  options: NotificationOptions = {},
): Promise<StoreOrder> {
  const input = normaliseCompletedOrder(rawInput);
  const sql = await ensureOrdersTable();

  const existing = await sql.query<StoreOrderRow>(
    `select * from store_orders
      where payment_provider = $1 and payment_reference = $2
      limit 1`,
    [input.paymentProvider, input.paymentReference],
  );
  if (existing[0]) return toOrder(existing[0]);

  const id = randomUUID();
  const number = orderNumber();
  const rows = await sql.query<StoreOrderRow>(
    `insert into store_orders (
       id, order_number, status, currency, subtotal, shipping_amount, total,
       shipping_method, customer, shipping_address, items, payment_provider,
       payment_reference
     ) values (
       $1, $2, 'paid', $3, $4, $5, $6,
       $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12
     )
     returning *`,
    [
      id,
      number,
      input.currency,
      input.subtotal,
      input.shippingAmount,
      input.total,
      input.shippingMethod,
      JSON.stringify(input.customer),
      JSON.stringify(input.shippingAddress),
      JSON.stringify(input.items),
      input.paymentProvider,
      input.paymentReference,
    ],
  );

  let order = toOrder(rows[0]);
  if (storeOrderDiscordConfigured()) {
    try {
      await sendStoreOrderDiscordNotification(order, options);
      await markDiscordResult(order.id, true, null);
      order = {
        ...order,
        discordNotified: true,
        discordNotifiedAt: new Date().toISOString(),
        discordError: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discord notification failed.";
      await markDiscordResult(order.id, false, message.slice(0, 500));
      order = { ...order, discordNotified: false, discordError: message.slice(0, 500) };
    }
  }

  return order;
}

export async function listStoreOrders(limit = 100): Promise<StoreOrder[]> {
  const sql = await ensureOrdersTable();
  const safeLimit = Math.max(1, Math.min(250, Math.floor(limit)));
  const rows = await sql.query<StoreOrderRow>(
    `select * from store_orders order by placed_at desc limit $1`,
    [safeLimit],
  );
  return rows.map(toOrder);
}

export async function getStoreOrder(orderId: string): Promise<StoreOrder | null> {
  const sql = await ensureOrdersTable();
  const rows = await sql.query<StoreOrderRow>(
    `select * from store_orders where id = $1 limit 1`,
    [orderId],
  );
  return rows[0] ? toOrder(rows[0]) : null;
}

export async function countStoreOrders(): Promise<number> {
  const sql = await ensureOrdersTable();
  const rows = await sql.query<{ count: number }>(
    `select count(*)::bigint as count from store_orders`,
  );
  return Number(rows[0]?.count || 0);
}

export async function updateStoreOrderStatus(
  orderId: string,
  status: StoreOrderStatus,
): Promise<StoreOrder> {
  if (!STORE_ORDER_STATUSES.includes(status)) throw new Error("Invalid order status.");
  const sql = await ensureOrdersTable();
  const rows = await sql.query<StoreOrderRow>(
    `update store_orders
        set status = $2, updated_at = now()
      where id = $1
      returning *`,
    [orderId, status],
  );
  if (!rows[0]) throw new Error("Store order was not found.");

  const order = toOrder(rows[0]);
  if (storeOrderBotConfigured()) {
    try {
      await postBot("/store-orders/status", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
        discordName: order.customer.discordName || "",
      });
      await markDiscordResult(order.id, true, null);
      return {
        ...order,
        discordNotified: true,
        discordNotifiedAt: order.discordNotifiedAt || new Date().toISOString(),
        discordError: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Discord status update failed.";
      await markDiscordResult(order.id, false, message.slice(0, 500));
      return { ...order, discordNotified: false, discordError: message.slice(0, 500) };
    }
  }
  return order;
}

export async function resendStoreOrderDiscordNotification(orderId: string): Promise<StoreOrder> {
  const order = await getStoreOrder(orderId);
  if (!order) throw new Error("Store order was not found.");
  try {
    const isTest = order.paymentProvider.toLowerCase().includes("test");
    await sendStoreOrderDiscordNotification(order, { test: isTest });
    await markDiscordResult(order.id, true, null);
    return {
      ...order,
      discordNotified: true,
      discordNotifiedAt: new Date().toISOString(),
      discordError: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discord notification failed.";
    await markDiscordResult(order.id, false, message.slice(0, 500));
    throw new Error(message);
  }
}

export async function sendStoreOrderDiscordTest(discordName = "@TestCustomer"): Promise<void> {
  const now = new Date().toISOString();
  const testOrder: StoreOrder = {
    id: `discord-test-${randomUUID()}`,
    orderNumber: `MI-TEST-${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`,
    status: "paid",
    currency: "AUD",
    subtotal: 15,
    shippingAmount: 10,
    total: 25,
    shippingMethod: "Standard",
    customer: {
      firstName: "Test",
      lastName: "Customer",
      email: "test@example.invalid",
      phone: "Not included in Discord",
      discordName: cleanText(discordName, 120) || "@TestCustomer",
    },
    shippingAddress: {
      address: "Private address only shown on the admin page",
      city: "Nambour",
      state: "QLD",
      postalCode: "4560",
      country: "Australia",
    },
    items: [
      {
        productId: "test-product",
        productName: "1st M.I. 3D Printed Logo",
        quantity: 1,
        unitPrice: 15,
        lineTotal: 15,
      },
    ],
    paymentProvider: "Test mode",
    paymentReference: `TEST-${randomUUID()}`,
    placedAt: now,
    updatedAt: now,
    discordNotified: false,
    discordNotifiedAt: null,
    discordError: null,
  };
  await sendStoreOrderDiscordNotification(testOrder, { test: true });
}
