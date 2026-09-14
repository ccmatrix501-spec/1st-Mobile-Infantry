import type { StoreOrder } from "@/lib/store-orders";

export type StoreEmailType =
  | "confirmed"
  | "paid"
  | "approved"
  | "packing"
  | "shipped"
  | "completed"
  | "cancelled";

export type StoreEmailExtras = {
  type: StoreEmailType;
  message?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  productImages?: Record<string, string>;
};

const STORE_URL = "https://www.1stmid.com/store";
const SITE_URL = "https://www.1stmid.com";
const LOGO_URL = `${SITE_URL}/mi-emblem.jpg`;

const TYPE_DETAILS: Record<
  StoreEmailType,
  { title: string; status: string; defaultMessage: string }
> = {
  confirmed: {
    title: "Order Confirmed",
    status: "CONFIRMED",
    defaultMessage: "Your order has been received and is now in our system.",
  },
  paid: {
    title: "Payment Confirmed",
    status: "PAID",
    defaultMessage: "Your payment has been received and your order can now move to fulfilment.",
  },
  approved: {
    title: "Order Approved",
    status: "APPROVED",
    defaultMessage: "Your order has been approved and is being prepared for fulfilment.",
  },
  packing: {
    title: "We're Preparing Your Order",
    status: "PACKING",
    defaultMessage: "Your order is currently being prepared and packed.",
  },
  shipped: {
    title: "Your Order Has Shipped",
    status: "SHIPPED",
    defaultMessage: "Your order has left the 1st M.I. Store and is now on its way.",
  },
  completed: {
    title: "Order Completed",
    status: "COMPLETED",
    defaultMessage: "Your order has been marked as completed. Thank you for supporting the 1st M.I.",
  },
  cancelled: {
    title: "Order Cancelled",
    status: "CANCELLED",
    defaultMessage: "Your order has been cancelled. If you believe this is incorrect, reply to this email and we'll assist you.",
  },
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(value);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency || "AUD"}`;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(date);
}

function absoluteImageUrl(value: string | undefined): string {
  const image = String(value || "").trim();
  if (!image) return "";
  if (/^https:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${SITE_URL}${image}`;
  return "";
}

function customerName(order: StoreOrder): string {
  return `${order.customer.firstName} ${order.customer.lastName}`.trim();
}

export function storeEmailSubject(order: StoreOrder, extras: StoreEmailExtras): string {
  const details = TYPE_DETAILS[extras.type];
  return `${order.orderNumber} — ${details.title} — 1st M.I. Store`;
}

export function storeEmailPlainText(order: StoreOrder, extras: StoreEmailExtras): string {
  const details = TYPE_DETAILS[extras.type];
  const name = customerName(order);
  const items = order.items
    .map((item) => {
      const variant = item.variantName ? ` (${item.variantName})` : "";
      return `${item.quantity} × ${item.productName}${variant} — ${money(item.lineTotal, order.currency)}`;
    })
    .join("\n");

  return `${details.title}

Hi ${name},

${extras.message?.trim() || details.defaultMessage}

Order: ${order.orderNumber}
Date: ${formatDate(order.placedAt)}

${items}

Subtotal: ${money(order.subtotal, order.currency)}
Shipping: ${money(order.shippingAmount, order.currency)}
Total: ${money(order.total, order.currency)}

Shipping Method: ${order.shippingMethod || "Not specified"}${extras.trackingNumber ? `\nTracking: ${extras.trackingNumber}` : ""}${extras.estimatedDelivery ? `\nEstimated Delivery: ${extras.estimatedDelivery}` : ""}

Shipping To:
${name}
${order.shippingAddress.address}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
${order.shippingAddress.country}

1st M.I. Store
${STORE_URL}`.trim();
}

export function buildStoreEmailHtml(order: StoreOrder, extras: StoreEmailExtras): string {
  const details = TYPE_DETAILS[extras.type];
  const name = customerName(order);
  const message = extras.message?.trim() || details.defaultMessage;
  const productImages = extras.productImages || {};

  const productRows = order.items
    .map((item) => {
      const image = absoluteImageUrl(productImages[item.productId]);
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:9px;background:#181e19;border:1px solid #363d37;">
          <tr>
            ${
              image
                ? `<td width="102" valign="middle" style="width:102px;padding:12px;">
                    <img src="${escapeHtml(image)}" width="78" alt="${escapeHtml(item.productName)}" style="display:block;width:78px;max-width:78px;height:auto;background:#090c0a;border:1px solid #414841;">
                  </td>`
                : ""
            }
            <td valign="middle" style="padding:15px 16px;">
              <div style="font-size:14px;line-height:20px;font-weight:700;color:#f5f5f0;">${escapeHtml(item.productName)}</div>
              ${item.variantName ? `<div style="margin-top:4px;font-size:11px;line-height:17px;color:#818982;">${escapeHtml(item.variantName)}</div>` : ""}
              <div style="margin-top:6px;font-size:10px;line-height:16px;color:#737b74;">${item.quantity} × ${escapeHtml(money(item.unitPrice, order.currency))}</div>
            </td>
            <td align="right" valign="middle" style="padding:15px 16px;font-size:14px;font-weight:700;color:#ffffff;white-space:nowrap;">${escapeHtml(money(item.lineTotal, order.currency))}</td>
          </tr>
        </table>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(details.title)} — 1st M.I. Store</title>
</head>
<body style="margin:0;padding:0;background:#060907;font-family:Arial,Helvetica,sans-serif;color:#eeeeea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#060907;">
<tr><td align="center" style="padding:28px 10px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#101511;border:1px solid #303831;">

<tr><td style="padding:10px 28px;background:#080b09;border-bottom:1px solid #303631;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:9px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#747d75;">Federal Armed Services</td>
<td align="right" style="font-size:9px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#73dca2;">● &nbsp; 1st M.I. Store</td>
</tr></table>
</td></tr>

<tr><td align="center" style="padding:27px;background:#0c100d;">
<img src="${LOGO_URL}" width="170" alt="1st Mobile Infantry" style="display:block;width:170px;max-width:70%;height:auto;margin:0 auto;border:0;">
<div style="margin-top:15px;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8e968f;">1st Mobile Infantry · Store</div>
</td></tr>

<tr><td height="4" style="height:4px;background:#f1f2ec;font-size:1px;line-height:1px;">&nbsp;</td></tr>

<tr><td style="padding:34px 32px 29px;background:#111713;">
<div style="font-size:9px;font-weight:700;letter-spacing:1.7px;text-transform:uppercase;color:#788179;">Store Order Update</div>
<div style="margin-top:8px;font-size:32px;line-height:38px;font-weight:900;color:#f7f8f3;">${escapeHtml(details.title)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:17px;"><tr>
<td style="padding:8px 12px;background:#102219;border:1px solid #2b6245;font-size:10px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#73dca2;">● &nbsp; ${escapeHtml(details.status)}</td>
</tr></table>
<p style="margin:25px 0 8px;font-size:15px;line-height:24px;color:#e5e7e2;">Hi ${escapeHtml(name)},</p>
<p style="margin:0;font-size:14px;line-height:23px;color:#a5ada6;">${escapeHtml(message)}</p>
</td></tr>

<tr><td style="padding:13px 32px;background:#080b09;border-top:1px solid #303631;border-bottom:1px solid #303631;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#737b74;">Order Number</td>
<td align="right" style="font-family:'Courier New',monospace;font-size:12px;font-weight:700;color:#f2f2ed;">${escapeHtml(order.orderNumber)}</td>
</tr></table>
</td></tr>

<tr><td style="padding:28px 32px 10px;background:#111713;">
<div style="margin-bottom:11px;font-size:9px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7c857d;">Your Order · ${escapeHtml(formatDate(order.placedAt))}</div>
${productRows}
</td></tr>

<tr><td style="padding:10px 32px;background:#111713;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d110e;border:1px solid #353b36;">
<tr><td style="padding:12px 16px;border-bottom:1px solid #303631;font-size:12px;color:#818982;">Subtotal</td><td align="right" style="padding:12px 16px;border-bottom:1px solid #303631;font-size:12px;color:#daddd9;">${escapeHtml(money(order.subtotal, order.currency))}</td></tr>
<tr><td style="padding:12px 16px;border-bottom:1px solid #303631;font-size:12px;color:#818982;">Shipping</td><td align="right" style="padding:12px 16px;border-bottom:1px solid #303631;font-size:12px;color:#daddd9;">${escapeHtml(money(order.shippingAmount, order.currency))}</td></tr>
<tr><td style="padding:16px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#eeeeea;">Total</td><td align="right" style="padding:16px;font-size:20px;font-weight:900;color:#ffffff;">${escapeHtml(money(order.total, order.currency))}</td></tr>
</table>
</td></tr>

<tr><td style="padding:22px 32px;background:#111713;">
<div style="margin-bottom:10px;font-size:9px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7c857d;">Delivery</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#102018;border:1px solid #2b5c42;"><tr><td style="padding:17px 18px;font-size:13px;line-height:22px;color:#dfe6e0;">
<strong>Method:</strong> ${escapeHtml(order.shippingMethod || "Not specified")}
${extras.trackingNumber ? `<br><strong>Tracking:</strong> ${escapeHtml(extras.trackingNumber)}` : ""}
${extras.estimatedDelivery ? `<br><strong>Estimated Delivery:</strong> ${escapeHtml(extras.estimatedDelivery)}` : ""}
</td></tr></table>
</td></tr>

<tr><td style="padding:0 32px 28px;background:#111713;">
<div style="margin-bottom:10px;font-size:9px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#7c857d;">Shipping To</div>
<div style="padding:16px 18px;background:#181e19;border:1px solid #353c36;font-size:13px;line-height:21px;color:#c1c7c1;">
<strong style="color:#ffffff;">${escapeHtml(name)}</strong><br>
${escapeHtml(order.shippingAddress.address)}<br>
${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.state)} ${escapeHtml(order.shippingAddress.postalCode)}<br>
${escapeHtml(order.shippingAddress.country)}
</div>
</td></tr>

<tr><td align="center" style="padding:8px 32px 32px;background:#111713;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#f3f3ee;border:1px solid #ffffff;">
<a href="${STORE_URL}" style="display:inline-block;padding:15px 28px;font-size:10px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#090c0a;text-decoration:none;">Visit 1st M.I. Store →</a>
</td></tr></table>
</td></tr>

<tr><td align="center" style="padding:27px 30px;background:#0c100d;border-top:1px solid #343a35;">
<div style="font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#6c746d;">Standing Order</div>
<div style="margin-top:9px;font-size:18px;line-height:25px;font-weight:800;font-style:italic;color:#f1f1ec;">No one stacks them high like the First M.I.</div>
<div style="margin-top:10px;font-size:11px;line-height:17px;color:#858d86;">The first to drop. The last to leave.</div>
</td></tr>

<tr><td align="center" style="padding:27px 30px;background:#080b09;border-top:1px solid #303531;">
<img src="${LOGO_URL}" width="70" alt="1st Mobile Infantry" style="display:block;width:70px;max-width:70px;height:auto;margin:0 auto 13px;border:0;">
<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6c746d;">Federal Armed Services</div>
<div style="margin-top:5px;font-size:13px;font-weight:800;color:#eeeeea;">1st Mobile Infantry</div>
<div style="margin-top:8px;font-size:10px;color:#737b74;">Service Guarantees Citizenship.</div>
<div style="margin-top:18px;padding-top:16px;border-top:1px solid #292f2a;font-size:9px;line-height:17px;color:#515852;">This email relates to an order or enquiry with the 1st M.I. Store.<br><br>Unofficial fan community.</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
