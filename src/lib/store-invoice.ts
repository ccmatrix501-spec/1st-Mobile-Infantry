import type { StoreOrder, StoreOrderAddress, StoreOrderStatus } from "@/lib/store-orders";

export type StoreInvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export type StoreInvoiceLine = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type StoreInvoiceDraft = {
  orderId: string;
  orderNumber: string;
  orderStatus: StoreOrderStatus;
  invoiceNumber: string;
  status: StoreInvoiceStatus;
  issueDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  discordName: string;
  billingAddress: StoreOrderAddress;
  currency: string;
  lines: StoreInvoiceLine[];
  shippingMethod: string;
  shippingAmount: number;
  discountAmount: number;
  notes: string;
  paymentInstructions: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export type StoreInvoiceTotals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function plusDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function invoiceTotals(invoice: Pick<StoreInvoiceDraft, "lines" | "shippingAmount" | "discountAmount">): StoreInvoiceTotals {
  const subtotal = roundMoney(
    invoice.lines.reduce(
      (sum, line) => sum + Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0),
      0,
    ),
  );
  const shipping = roundMoney(Math.max(0, Number(invoice.shippingAmount) || 0));
  const discount = roundMoney(Math.max(0, Number(invoice.discountAmount) || 0));
  const total = roundMoney(Math.max(0, subtotal + shipping - discount));
  return { subtotal, shipping, discount, total };
}

export function storeInvoiceFromOrder(order: StoreOrder): StoreInvoiceDraft {
  const now = new Date();
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    invoiceNumber: `INV-${order.orderNumber}`,
    status: order.status === "paid" || order.status === "completed" ? "paid" : "draft",
    issueDate: isoDate(now),
    dueDate: isoDate(plusDays(now, 7)),
    customerName,
    customerEmail: order.customer.email,
    discordName: order.customer.discordName || "",
    billingAddress: { ...order.shippingAddress },
    currency: order.currency || "AUD",
    lines: order.items.map((item, index) => ({
      id: `${item.productId || "item"}-${index + 1}`,
      description: item.variantName ? `${item.productName} — ${item.variantName}` : item.productName,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    })),
    shippingMethod: order.shippingMethod || "Shipping",
    shippingAmount: Math.max(0, Number(order.shippingAmount) || 0),
    discountAmount: 0,
    notes: "Thank you for supporting 1st M.I. Merchandise.",
    paymentInstructions: order.paymentProvider
      ? `Payment method: ${order.paymentProvider}. Please use ${order.orderNumber} as your payment reference unless staff advise otherwise.`
      : `Please use ${order.orderNumber} as your payment reference unless staff advise otherwise.`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sentAt: null,
  };
}

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(value);
  } catch {
    return `${currency || "AUD"} ${Number(value || 0).toFixed(2)}`;
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function addressLines(address: StoreOrderAddress): string[] {
  return [
    address.address,
    [address.city, address.state, address.postalCode].filter(Boolean).join(" "),
    address.country,
  ].filter(Boolean);
}

export function storeInvoiceSubject(invoice: StoreInvoiceDraft): string {
  return `Invoice ${invoice.invoiceNumber} — ${invoice.orderNumber} — 1st M.I. Merchandise`;
}

export function storeInvoicePlainText(invoice: StoreInvoiceDraft): string {
  const totals = invoiceTotals(invoice);
  const lines = invoice.lines.map(
    (line) => `${line.description} — ${line.quantity} × ${money(line.unitPrice, invoice.currency)} = ${money(line.quantity * line.unitPrice, invoice.currency)}`,
  );
  return [
    "1st M.I. Merchandise",
    `INVOICE ${invoice.invoiceNumber}`,
    `Order: ${invoice.orderNumber}`,
    `Issue date: ${invoice.issueDate}`,
    `Due date: ${invoice.dueDate || "On receipt"}`,
    "",
    `Bill to: ${invoice.customerName}`,
    invoice.customerEmail,
    ...addressLines(invoice.billingAddress),
    "",
    ...lines,
    "",
    `Subtotal: ${money(totals.subtotal, invoice.currency)}`,
    `${invoice.shippingMethod || "Shipping"}: ${money(totals.shipping, invoice.currency)}`,
    totals.discount > 0 ? `Discount: -${money(totals.discount, invoice.currency)}` : "",
    `TOTAL: ${money(totals.total, invoice.currency)}`,
    "",
    invoice.paymentInstructions ? `Payment instructions:\n${invoice.paymentInstructions}` : "",
    invoice.notes ? `Notes:\n${invoice.notes}` : "",
    "",
    "This is an invoice, not a tax invoice.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildStoreInvoiceHtml(invoice: StoreInvoiceDraft): string {
  const totals = invoiceTotals(invoice);
  const itemRows = invoice.lines
    .map((line) => {
      const lineTotal = Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitPrice) || 0);
      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e4e7eb;color:#161b1f;">${escapeHtml(line.description)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e4e7eb;text-align:center;color:#161b1f;">${escapeHtml(line.quantity)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e4e7eb;text-align:right;color:#161b1f;">${escapeHtml(money(line.unitPrice, invoice.currency))}</td>
          <td style="padding:12px 10px;border-bottom:1px solid #e4e7eb;text-align:right;font-weight:700;color:#161b1f;">${escapeHtml(money(lineTotal, invoice.currency))}</td>
        </tr>`;
    })
    .join("");

  const address = addressLines(invoice.billingAddress).map(escapeHtml).join("<br />");
  const discountRow = totals.discount > 0
    ? `<tr><td style="padding:5px 0;color:#5b6670;">Discount</td><td style="padding:5px 0;text-align:right;color:#161b1f;">-${escapeHtml(money(totals.discount, invoice.currency))}</td></tr>`
    : "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    @media print { body { background:#fff !important; } .print-note { display:none !important; } }
  </style>
</head>
<body style="margin:0;background:#eef1f3;font-family:Arial,Helvetica,sans-serif;color:#161b1f;">
  <div style="max-width:820px;margin:0 auto;padding:28px 14px;">
    <div style="background:#0b1110;border-top:5px solid #23d36b;border-radius:12px 12px 0 0;padding:24px 28px;color:#fff;">
      <div style="font-size:12px;letter-spacing:2px;color:#23d36b;font-weight:700;">1ST MOBILE INFANTRY</div>
      <div style="margin-top:5px;font-size:27px;font-weight:800;letter-spacing:.5px;">MERCHANDISE INVOICE</div>
      <div style="margin-top:7px;color:#aeb8b4;font-size:13px;">Invoice · not a tax invoice</div>
    </div>
    <div style="background:#fff;border:1px solid #dfe4e7;border-top:0;border-radius:0 0 12px 12px;padding:28px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;padding-right:18px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#23a85a;font-weight:700;">Bill to</div>
            <div style="margin-top:7px;font-size:18px;font-weight:800;">${escapeHtml(invoice.customerName)}</div>
            <div style="margin-top:4px;color:#5b6670;font-size:13px;line-height:1.6;">${escapeHtml(invoice.customerEmail)}${invoice.discordName ? `<br />Discord: ${escapeHtml(invoice.discordName)}` : ""}${address ? `<br />${address}` : ""}</div>
          </td>
          <td style="vertical-align:top;text-align:right;min-width:230px;">
            <div style="font-size:12px;color:#5b6670;">Invoice number</div>
            <div style="font-size:18px;font-weight:800;">${escapeHtml(invoice.invoiceNumber)}</div>
            <div style="margin-top:10px;font-size:12px;color:#5b6670;">Order</div>
            <div style="font-weight:700;">${escapeHtml(invoice.orderNumber)}</div>
            <div style="margin-top:10px;font-size:12px;color:#5b6670;">Issue date</div>
            <div style="font-weight:700;">${escapeHtml(invoice.issueDate)}</div>
            <div style="margin-top:10px;font-size:12px;color:#5b6670;">Due date</div>
            <div style="font-weight:700;">${escapeHtml(invoice.dueDate || "On receipt")}</div>
          </td>
        </tr>
      </table>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:28px;border:1px solid #dfe4e7;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f5f7f8;">
            <th style="padding:11px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5b6670;">Item</th>
            <th style="padding:11px 10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5b6670;">Qty</th>
            <th style="padding:11px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5b6670;">Unit</th>
            <th style="padding:11px 10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#5b6670;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:20px;">
        <table role="presentation" style="width:320px;border-collapse:collapse;">
          <tr><td style="padding:5px 0;color:#5b6670;">Subtotal</td><td style="padding:5px 0;text-align:right;color:#161b1f;">${escapeHtml(money(totals.subtotal, invoice.currency))}</td></tr>
          <tr><td style="padding:5px 0;color:#5b6670;">${escapeHtml(invoice.shippingMethod || "Shipping")}</td><td style="padding:5px 0;text-align:right;color:#161b1f;">${escapeHtml(money(totals.shipping, invoice.currency))}</td></tr>
          ${discountRow}
          <tr><td style="padding:12px 0 5px;border-top:2px solid #161b1f;font-size:18px;font-weight:800;">TOTAL</td><td style="padding:12px 0 5px;border-top:2px solid #161b1f;text-align:right;font-size:21px;font-weight:900;color:#13a850;">${escapeHtml(money(totals.total, invoice.currency))}</td></tr>
        </table>
      </div>

      ${invoice.paymentInstructions ? `<div style="margin-top:26px;padding:16px;border-radius:8px;background:#f2fbf5;border:1px solid #c8efd4;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#15934a;font-weight:800;">Payment instructions</div><div style="margin-top:7px;font-size:13px;line-height:1.65;">${nl2br(invoice.paymentInstructions)}</div></div>` : ""}
      ${invoice.notes ? `<div style="margin-top:18px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#5b6670;font-weight:800;">Notes</div><div style="margin-top:7px;font-size:13px;line-height:1.65;color:#4b555d;">${nl2br(invoice.notes)}</div></div>` : ""}

      <div style="margin-top:28px;padding-top:18px;border-top:1px solid #dfe4e7;font-size:11px;line-height:1.6;color:#7b858d;">
        1st M.I. Merchandise · 1stmid.com · This document is an invoice and is not presented as a tax invoice.
      </div>
    </div>
  </div>
</body>
</html>`;
}
