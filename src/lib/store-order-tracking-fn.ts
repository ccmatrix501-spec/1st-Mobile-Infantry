import { createServerFn } from "@tanstack/react-start";
import type {
  StoreOrderAddress,
  StoreOrderCustomer,
  StoreOrderItem,
  StoreOrderStatus,
} from "@/lib/store-orders";

const DEFAULT_SITE_URL = "https://www.1stmid.com";

type AccessRow = {
  order_id: string;
  access_token: string;
  tracking_number: string | null;
  estimated_delivery: string | null;
};

type PublicTrackingRow = {
  order_number: string;
  status: StoreOrderStatus | string;
  currency: string;
  subtotal: string | number;
  shipping_amount: string | number;
  total: string | number;
  shipping_method: string;
  customer: StoreOrderCustomer | string;
  shipping_address: StoreOrderAddress | string;
  items: StoreOrderItem[] | string;
  placed_at: Date | string;
  updated_at: Date | string;
  tracking_number: string | null;
  estimated_delivery: string | null;
};

export type LeadershipOrderTrackingAccess = {
  url: string;
  trackingNumber: string;
  estimatedDelivery: string;
};

export type PublicStoreOrderTracking = {
  orderNumber: string;
  status: StoreOrderStatus;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  shippingMethod: string;
  customerFirstName: string;
  destination: {
    city: string;
    state: string;
    country: string;
  };
  items: StoreOrderItem[];
  placedAt: string;
  updatedAt: string;
  trackingNumber: string;
  estimatedDelivery: string;
};

function asJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function iso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function normaliseStatus(value: unknown): StoreOrderStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (
    status === "new" ||
    status === "paid" ||
    status === "approved" ||
    status === "packing" ||
    status === "shipped" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "new";
}

function siteUrl(): string {
  const configured =
    process.env.STORE_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!configured) return DEFAULT_SITE_URL;
  if (/^https?:\/\//i.test(configured)) return configured.replace(/\/$/, "");
  return `https://${configured.replace(/\/$/, "")}`;
}

function newAccessToken(): string {
  return `${globalThis.crypto.randomUUID()}${globalThis.crypto.randomUUID()}`.replaceAll("-", "");
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.getSql();
}

async function ensureTrackingTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_order_customer_access (
      order_id text primary key,
      access_token text not null unique,
      tracking_number text not null default '',
      estimated_delivery text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create unique index if not exists store_order_customer_access_token_idx
      on store_order_customer_access (access_token)
  `);
  return sql;
}

async function ensureAccessForOrder(orderId: string): Promise<AccessRow> {
  const sql = await ensureTrackingTable();
  const orders = await sql.query<{ id: string }>(
    "select id from store_orders where id = $1 limit 1",
    [orderId],
  );
  if (!orders[0]) throw new Error("Store order was not found.");

  let rows = await sql.query<AccessRow>(
    `select order_id, access_token, tracking_number, estimated_delivery
       from store_order_customer_access
      where order_id = $1
      limit 1`,
    [orderId],
  );

  if (!rows[0]) {
    await sql.query(
      `insert into store_order_customer_access
         (order_id, access_token, tracking_number, estimated_delivery, created_at, updated_at)
       values ($1, $2, '', '', now(), now())
       on conflict (order_id) do nothing`,
      [orderId, newAccessToken()],
    );
    rows = await sql.query<AccessRow>(
      `select order_id, access_token, tracking_number, estimated_delivery
         from store_order_customer_access
        where order_id = $1
        limit 1`,
      [orderId],
    );
  }

  if (!rows[0]) throw new Error("Could not create customer tracking access.");
  return rows[0];
}

function accessResult(row: AccessRow): LeadershipOrderTrackingAccess {
  return {
    url: `${siteUrl()}/store/order/${encodeURIComponent(row.access_token)}`,
    trackingNumber: row.tracking_number || "",
    estimatedDelivery: row.estimated_delivery || "",
  };
}

export const ensureLeadershipStoreOrderTrackingLink = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }): Promise<LeadershipOrderTrackingAccess> => {
    const access = await import("@/lib/local-leadership-access.server");
    await access.requireLocalLeadership();
    const orderId = cleanText(data.orderId, 200);
    if (!orderId) throw new Error("Order id is required.");
    return accessResult(await ensureAccessForOrder(orderId));
  });

export const saveLeadershipStoreOrderTrackingDetails = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      orderId: string;
      trackingNumber: string;
      estimatedDelivery: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<LeadershipOrderTrackingAccess> => {
    const access = await import("@/lib/local-leadership-access.server");
    await access.requireLocalLeadership();

    const orderId = cleanText(data.orderId, 200);
    if (!orderId) throw new Error("Order id is required.");
    const current = await ensureAccessForOrder(orderId);
    const trackingNumber = cleanText(data.trackingNumber, 180);
    const estimatedDelivery = cleanText(data.estimatedDelivery, 180);
    const sql = await ensureTrackingTable();

    await sql.query(
      `update store_order_customer_access
          set tracking_number = $2,
              estimated_delivery = $3,
              updated_at = now()
        where order_id = $1`,
      [orderId, trackingNumber, estimatedDelivery],
    );

    return accessResult({
      ...current,
      tracking_number: trackingNumber,
      estimated_delivery: estimatedDelivery,
    });
  });

export const fetchPublicStoreOrderTracking = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }): Promise<PublicStoreOrderTracking | null> => {
    const token = cleanText(data.token, 128);
    if (!/^[a-f0-9]{64}$/i.test(token)) return null;

    const sql = await ensureTrackingTable();
    const rows = await sql.query<PublicTrackingRow>(
      `select
         o.order_number,
         o.status,
         o.currency,
         o.subtotal,
         o.shipping_amount,
         o.total,
         o.shipping_method,
         o.customer,
         o.shipping_address,
         o.items,
         o.placed_at,
         o.updated_at,
         a.tracking_number,
         a.estimated_delivery
       from store_order_customer_access a
       join store_orders o on o.id = a.order_id
       where a.access_token = $1
       limit 1`,
      [token],
    );

    const row = rows[0];
    if (!row) return null;

    const customer = asJson(row.customer);
    const address = asJson(row.shipping_address);
    const items = asJson(row.items);

    return {
      orderNumber: row.order_number,
      status: normaliseStatus(row.status),
      currency: row.currency || "AUD",
      subtotal: Number(row.subtotal) || 0,
      shippingAmount: Number(row.shipping_amount) || 0,
      total: Number(row.total) || 0,
      shippingMethod: row.shipping_method || "Shipping",
      customerFirstName: customer.firstName || "Customer",
      destination: {
        city: address.city || "",
        state: address.state || "",
        country: address.country || "",
      },
      items: Array.isArray(items) ? items : [],
      placedAt: iso(row.placed_at),
      updatedAt: iso(row.updated_at),
      trackingNumber: row.tracking_number || "",
      estimatedDelivery: row.estimated_delivery || "",
    };
  });
