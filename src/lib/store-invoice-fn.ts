import { createServerFn } from "@tanstack/react-start";
import {
  storeInvoiceFromOrder,
  type StoreInvoiceDraft,
  type StoreInvoiceLine,
  type StoreInvoiceStatus,
} from "@/lib/store-invoice";
import type { StoreOrderAddress, StoreOrderStatus } from "@/lib/store-orders";

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.getSql();
}

async function ensureInvoiceTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_invoices (
      order_id text primary key,
      invoice_number text not null,
      config jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `);
  await sql.query(`
    create unique index if not exists store_invoices_invoice_number_idx
      on store_invoices (invoice_number)
  `);
  await sql.query(`
    create index if not exists store_invoices_updated_at_idx
      on store_invoices (updated_at desc)
  `);
  return sql;
}

type InvoiceRow = {
  order_id: string;
  invoice_number: string;
  config: StoreInvoiceDraft | string;
  created_at: Date | string;
  updated_at: Date | string;
};

function asJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
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
  if (!Number.isFinite(number)) return 1;
  return Math.max(1, Math.min(9999, number));
}

function cleanDate(value: unknown): string {
  const text = cleanText(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function cleanStatus(value: unknown): StoreInvoiceStatus {
  const status = cleanText(value, 20).toLowerCase() as StoreInvoiceStatus;
  return ["draft", "sent", "paid", "cancelled"].includes(status) ? status : "draft";
}

function cleanOrderStatus(value: unknown): StoreOrderStatus {
  const status = cleanText(value, 20).toLowerCase() as StoreOrderStatus;
  return ["new", "paid", "approved", "packing", "shipped", "completed", "cancelled"].includes(status)
    ? status
    : "new";
}

function cleanAddress(value: Partial<StoreOrderAddress> | undefined): StoreOrderAddress {
  return {
    address: cleanText(value?.address, 300),
    city: cleanText(value?.city, 120),
    state: cleanText(value?.state, 120),
    postalCode: cleanText(value?.postalCode, 40),
    country: cleanText(value?.country, 120),
  };
}

function cleanLines(value: StoreInvoiceLine[]): StoreInvoiceLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((line, index) => ({
    id: cleanText(line.id, 160) || `line-${index + 1}`,
    description: cleanText(line.description, 500) || "Invoice item",
    quantity: cleanQuantity(line.quantity),
    unitPrice: cleanMoney(line.unitPrice),
  }));
}

function normaliseInvoice(value: StoreInvoiceDraft): StoreInvoiceDraft {
  const now = new Date().toISOString();
  const orderId = cleanText(value.orderId, 200);
  const orderNumber = cleanText(value.orderNumber, 120);
  const invoiceNumber = cleanText(value.invoiceNumber, 140).replace(/[\r\n]/g, " ");
  const customerName = cleanText(value.customerName, 220);
  const customerEmail = cleanText(value.customerEmail, 240).toLowerCase();
  const lines = cleanLines(value.lines);

  if (!orderId || !orderNumber) throw new Error("Invoice is missing its linked order.");
  if (!invoiceNumber) throw new Error("Invoice number is required.");
  if (!customerName || !customerEmail) throw new Error("Customer name and email are required.");
  if (!lines.length) throw new Error("Invoice must contain at least one line item.");

  return {
    orderId,
    orderNumber,
    orderStatus: cleanOrderStatus(value.orderStatus),
    invoiceNumber,
    status: cleanStatus(value.status),
    issueDate: cleanDate(value.issueDate) || now.slice(0, 10),
    dueDate: cleanDate(value.dueDate),
    customerName,
    customerEmail,
    discordName: cleanText(value.discordName, 120),
    billingAddress: cleanAddress(value.billingAddress),
    currency: cleanText(value.currency, 8).toUpperCase() || "AUD",
    lines,
    shippingMethod: cleanText(value.shippingMethod, 120) || "Shipping",
    shippingAmount: cleanMoney(value.shippingAmount),
    discountAmount: cleanMoney(value.discountAmount),
    notes: cleanText(value.notes, 5000),
    paymentInstructions: cleanText(value.paymentInstructions, 5000),
    createdAt: cleanText(value.createdAt, 80) || now,
    updatedAt: now,
    sentAt: value.sentAt ? cleanText(value.sentAt, 80) : null,
  };
}

async function linkedOrder(orderId: string) {
  const orders = await import("@/lib/store-orders.server");
  const order = await orders.getStoreOrder(orderId);
  if (!order) throw new Error("Store order was not found.");
  return order;
}

export const fetchLeadershipStoreInvoice = createServerFn({ method: "GET" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }): Promise<StoreInvoiceDraft> => {
    await requireLeadership();
    const orderId = cleanText(data.orderId, 200);
    if (!orderId) throw new Error("Order id is required.");

    const order = await linkedOrder(orderId);
    const sql = await ensureInvoiceTable();
    const rows = await sql.query<InvoiceRow>(
      `select order_id, invoice_number, config, created_at, updated_at
         from store_invoices
        where order_id = $1
        limit 1`,
      [orderId],
    );

    if (!rows[0]) return storeInvoiceFromOrder(order);
    const saved = normaliseInvoice(asJson(rows[0].config));
    return {
      ...saved,
      orderStatus: order.status,
      updatedAt: new Date(rows[0].updated_at).toISOString(),
      createdAt: new Date(rows[0].created_at).toISOString(),
    };
  });

export const saveLeadershipStoreInvoice = createServerFn({ method: "POST" })
  .inputValidator((input: StoreInvoiceDraft) => input)
  .handler(async ({ data }): Promise<StoreInvoiceDraft> => {
    const profile = await requireLeadership();
    const invoice = normaliseInvoice(data);
    const order = await linkedOrder(invoice.orderId);
    const current = { ...invoice, orderStatus: order.status };
    const sql = await ensureInvoiceTable();

    try {
      const rows = await sql.query<InvoiceRow>(
        `insert into store_invoices (order_id, invoice_number, config, created_at, updated_at, updated_by)
         values ($1, $2, $3::jsonb, now(), now(), $4)
         on conflict (order_id) do update
         set invoice_number = excluded.invoice_number,
             config = excluded.config,
             updated_at = now(),
             updated_by = excluded.updated_by
         returning order_id, invoice_number, config, created_at, updated_at`,
        [current.orderId, current.invoiceNumber, JSON.stringify(current), profile.id],
      );
      const row = rows[0];
      if (!row) throw new Error("Could not save invoice draft.");
      return {
        ...normaliseInvoice(asJson(row.config)),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
      };
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not save invoice draft.";
      if (text.toLowerCase().includes("store_invoices_invoice_number_idx") || text.toLowerCase().includes("duplicate")) {
        throw new Error("That invoice number is already in use. Choose a different invoice number.");
      }
      throw error;
    }
  });
