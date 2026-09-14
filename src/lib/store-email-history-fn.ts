import { createServerFn } from "@tanstack/react-start";

type OrderCustomer = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type StoreEmailHistoryEntry = {
  id: string;
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail: string;
  emailType: string;
  subject: string;
  orderStatus: string;
  trackingNumber: string;
  estimatedDelivery: string;
  deliveryMethod: string;
  providerMessageId: string;
  sentAt: string;
};

export type StoreEmailHistoryDetail = StoreEmailHistoryEntry & {
  htmlBody: string;
  plainText: string;
};

export type StoreEmailHistoryRecordInput = {
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientName: string;
  senderEmail?: string;
  emailType: string;
  subject: string;
  orderStatus: string;
  trackingNumber: string;
  estimatedDelivery: string;
  htmlBody: string;
  plainText: string;
  deliveryMethod?: string;
  providerMessageId?: string;
};

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function asJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.getSql();
}

async function ensureEmailHistoryTable() {
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_email_history (
      id text primary key,
      order_id text not null,
      order_number text not null,
      recipient_email text not null,
      recipient_name text not null default '',
      sender_email text not null default '',
      email_type text not null,
      subject text not null,
      order_status text not null default '',
      tracking_number text not null default '',
      estimated_delivery text not null default '',
      delivery_method text not null default 'resend',
      provider_message_id text not null default '',
      html_body text not null default '',
      plain_text text not null default '',
      sent_at timestamptz not null default now()
    )
  `);
  await sql.query(`alter table store_email_history add column if not exists sender_email text not null default ''`);
  await sql.query(`alter table store_email_history add column if not exists provider_message_id text not null default ''`);
  await sql.query(`
    create index if not exists store_email_history_sent_at_idx
      on store_email_history (sent_at desc)
  `);
  await sql.query(`
    create index if not exists store_email_history_order_id_idx
      on store_email_history (order_id, sent_at desc)
  `);
  return sql;
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

type HistoryRow = {
  id: string;
  order_id: string;
  order_number: string;
  recipient_email: string;
  recipient_name: string;
  sender_email: string;
  email_type: string;
  subject: string;
  order_status: string;
  tracking_number: string;
  estimated_delivery: string;
  delivery_method: string;
  provider_message_id: string;
  html_body?: string;
  plain_text?: string;
  sent_at: Date | string;
};

function toSummary(row: HistoryRow): StoreEmailHistoryEntry {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    senderEmail: row.sender_email || "",
    emailType: row.email_type,
    subject: row.subject,
    orderStatus: row.order_status,
    trackingNumber: row.tracking_number || "",
    estimatedDelivery: row.estimated_delivery || "",
    deliveryMethod: row.delivery_method || "resend",
    providerMessageId: row.provider_message_id || "",
    sentAt: toIso(row.sent_at),
  };
}

export async function recordStoreEmailHistoryServer(
  data: StoreEmailHistoryRecordInput,
): Promise<StoreEmailHistoryEntry> {
  const orderId = cleanText(data.orderId, 200);
  const orderNumber = cleanText(data.orderNumber, 120);
  const recipientEmail = cleanText(data.recipientEmail, 240);
  const recipientName = cleanText(data.recipientName, 220);
  const senderEmail = cleanText(data.senderEmail, 240);
  const emailType = cleanText(data.emailType, 80);
  const subject = cleanText(data.subject, 400);
  const orderStatus = cleanText(data.orderStatus, 80);
  const trackingNumber = cleanText(data.trackingNumber, 180);
  const estimatedDelivery = cleanText(data.estimatedDelivery, 180);
  const deliveryMethod = cleanText(data.deliveryMethod, 80) || "resend";
  const providerMessageId = cleanText(data.providerMessageId, 240);
  const htmlBody = String(data.htmlBody ?? "").slice(0, 500_000);
  const plainText = String(data.plainText ?? "").slice(0, 100_000);

  if (!orderId || !orderNumber || !recipientEmail || !emailType || !subject) {
    throw new Error("Email history is missing required order or recipient details.");
  }

  const sql = await ensureEmailHistoryTable();
  const id = globalThis.crypto.randomUUID();
  const rows = await sql.query<HistoryRow>(
    `insert into store_email_history (
       id,
       order_id,
       order_number,
       recipient_email,
       recipient_name,
       sender_email,
       email_type,
       subject,
       order_status,
       tracking_number,
       estimated_delivery,
       delivery_method,
       provider_message_id,
       html_body,
       plain_text,
       sent_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now())
     returning
       id,
       order_id,
       order_number,
       recipient_email,
       recipient_name,
       sender_email,
       email_type,
       subject,
       order_status,
       tracking_number,
       estimated_delivery,
       delivery_method,
       provider_message_id,
       sent_at`,
    [
      id,
      orderId,
      orderNumber,
      recipientEmail,
      recipientName,
      senderEmail,
      emailType,
      subject,
      orderStatus,
      trackingNumber,
      estimatedDelivery,
      deliveryMethod,
      providerMessageId,
      htmlBody,
      plainText,
    ],
  );

  if (!rows[0]) throw new Error("Could not record the sent email.");
  return toSummary(rows[0]);
}

export async function recordSentStoreEmailForMatchingOrder(input: {
  recipientEmail: string;
  senderEmail: string;
  subject: string;
  htmlBody: string;
  plainText: string;
  providerMessageId?: string;
}): Promise<StoreEmailHistoryEntry | null> {
  const recipientEmail = cleanText(input.recipientEmail, 240).toLowerCase();
  const subject = cleanText(input.subject, 400);
  if (!recipientEmail || !subject) return null;

  const sql = await getSql();
  type MatchRow = {
    id: string;
    order_number: string;
    status: string;
    customer: OrderCustomer | string;
    tracking_number?: string | null;
    estimated_delivery?: string | null;
  };

  let rows: MatchRow[] = [];
  try {
    rows = await sql.query<MatchRow>(
      `select
         o.id,
         o.order_number,
         o.status,
         o.customer,
         a.tracking_number,
         a.estimated_delivery
       from store_orders o
       left join store_order_customer_access a on a.order_id = o.id
       where position(lower(o.order_number) in lower($1)) > 0
       order by o.placed_at desc
       limit 1`,
      [subject],
    );
  } catch {
    rows = await sql.query<MatchRow>(
      `select id, order_number, status, customer
         from store_orders
        where position(lower(order_number) in lower($1)) > 0
        order by placed_at desc
        limit 1`,
      [subject],
    );
  }

  if (!rows[0]) {
    const fallback = await sql.query<MatchRow>(
      `select id, order_number, status, customer
         from store_orders
        where lower(customer->>'email') = lower($1)
        order by placed_at desc
        limit 1`,
      [recipientEmail],
    );
    rows = fallback;
  }

  const row = rows[0];
  if (!row) return null;
  const customer = asJson<OrderCustomer>(row.customer);
  const recipientName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim();

  const typeMatch = subject.match(/—\s*([^—]+?)\s*—\s*1st M\.I\. Store/i);
  const emailType = typeMatch?.[1]?.trim().toLowerCase().replace(/\s+/g, "-") || "store-email";

  return recordStoreEmailHistoryServer({
    orderId: row.id,
    orderNumber: row.order_number,
    recipientEmail,
    recipientName,
    senderEmail: input.senderEmail,
    emailType,
    subject,
    orderStatus: row.status || "",
    trackingNumber: row.tracking_number || "",
    estimatedDelivery: row.estimated_delivery || "",
    deliveryMethod: "resend",
    providerMessageId: input.providerMessageId || "",
    htmlBody: input.htmlBody,
    plainText: input.plainText,
  });
}

export const fetchLeadershipStoreEmailHistory = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreEmailHistoryEntry[]> => {
    await requireLeadership();
    const sql = await ensureEmailHistoryTable();
    const rows = await sql.query<HistoryRow>(`
      select
        id,
        order_id,
        order_number,
        recipient_email,
        recipient_name,
        sender_email,
        email_type,
        subject,
        order_status,
        tracking_number,
        estimated_delivery,
        delivery_method,
        provider_message_id,
        sent_at
      from store_email_history
      order by sent_at desc
      limit 200
    `);
    return rows.map(toSummary);
  },
);

export const fetchLeadershipStoreEmailHistoryDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<StoreEmailHistoryDetail | null> => {
    await requireLeadership();
    const id = cleanText(data.id, 160);
    if (!id) return null;
    const sql = await ensureEmailHistoryTable();
    const rows = await sql.query<HistoryRow>(
      `select * from store_email_history where id = $1 limit 1`,
      [id],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ...toSummary(row),
      htmlBody: row.html_body || "",
      plainText: row.plain_text || "",
    };
  });

export const recordLeadershipStoreEmailSent = createServerFn({ method: "POST" })
  .inputValidator((input: StoreEmailHistoryRecordInput) => input)
  .handler(async ({ data }): Promise<StoreEmailHistoryEntry> => {
    await requireLeadership();
    return recordStoreEmailHistoryServer(data);
  });
