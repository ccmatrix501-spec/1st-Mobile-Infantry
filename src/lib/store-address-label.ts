import type { StoreOrder } from "@/lib/store-orders";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value: string | null | undefined): string {
  return escapeHtml((value || "").trim());
}

export function printStoreAddressLabel(order: StoreOrder): void {
  const printWindow = window.open("", "_blank", "width=760,height=680");
  if (!printWindow) {
    throw new Error("The label window was blocked. Allow pop-ups for 1stmid.com and try again.");
  }

  const customerName = clean(`${order.customer.firstName} ${order.customer.lastName}`.trim());
  const street = clean(order.shippingAddress.address);
  const city = clean(order.shippingAddress.city);
  const state = clean(order.shippingAddress.state);
  const postcode = clean(order.shippingAddress.postalCode);
  const country = clean(order.shippingAddress.country);
  const orderNumber = clean(order.orderNumber);
  const logoUrl = `${window.location.origin}/mi-emblem.jpg`;
  const localityLine = [city, state, postcode].filter(Boolean).join(" ");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${orderNumber} Address Label</title>
  <style>
    @page {
      size: 62mm auto;
      margin: 0;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      width: 62mm;
    }
    .label {
      width: 62mm;
      min-height: 82mm;
      padding: 3mm 3.5mm;
      display: flex;
      flex-direction: column;
      gap: 2.2mm;
      overflow: hidden;
    }
    .brand {
      display: grid;
      grid-template-columns: 15mm 1fr;
      gap: 2.5mm;
      align-items: center;
      padding-bottom: 2mm;
      border-bottom: 0.45mm solid #000;
    }
    .logo {
      width: 14mm;
      height: 14mm;
      object-fit: contain;
      filter: grayscale(1) contrast(1.15);
    }
    .brand-title {
      margin: 0;
      font-size: 12pt;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0.4px;
    }
    .site {
      margin-top: 1mm;
      font-size: 7.8pt;
      font-weight: 700;
    }
    .ship-to {
      margin-top: 0.6mm;
      font-size: 7pt;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .name {
      font-size: 12pt;
      font-weight: 900;
      line-height: 1.1;
      overflow-wrap: anywhere;
    }
    .address {
      font-size: 10.5pt;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .country {
      font-size: 10pt;
      font-weight: 900;
      text-transform: uppercase;
    }
    .footer {
      margin-top: auto;
      padding-top: 2mm;
      border-top: 0.3mm solid #000;
      display: flex;
      justify-content: space-between;
      gap: 2mm;
      font-size: 7.4pt;
      font-weight: 700;
    }
    .screen-note {
      display: none;
    }
    @media screen {
      body {
        width: auto;
        min-height: 100vh;
        display: grid;
        place-items: start center;
        padding: 24px;
        background: #e8e8e8;
      }
      .label {
        background: #fff;
        box-shadow: 0 8px 28px rgba(0,0,0,.18);
      }
      .screen-note {
        display: block;
        width: 62mm;
        margin: 12px auto 0;
        font-size: 12px;
        color: #333;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <main class="label">
    <header class="brand">
      <img class="logo" src="${logoUrl}" alt="1st M.I." />
      <div>
        <p class="brand-title">1ST M.I.</p>
        <div class="site">1stmid.com</div>
      </div>
    </header>

    <div class="ship-to">SHIP TO</div>
    <div class="name">${customerName || "CUSTOMER"}</div>
    ${street ? `<div class="address">${street}</div>` : ""}
    ${localityLine ? `<div class="address">${localityLine}</div>` : ""}
    ${country ? `<div class="country">${country}</div>` : ""}

    <footer class="footer">
      <span>ORDER ${orderNumber}</span>
      <span>1ST M.I. STORE</span>
    </footer>
  </main>
  <p class="screen-note">Brother QL-700: select a 62 mm roll, 100% scale / Actual Size, portrait, and no browser headers or footers.</p>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`);
  printWindow.document.close();
}
