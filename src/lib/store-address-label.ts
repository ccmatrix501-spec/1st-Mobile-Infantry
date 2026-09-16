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
  const printWindow = window.open("", "_blank", "width=760,height=760");
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
  const logoUrl = `${window.location.origin}/label-mobile-infantry-logo.jpg`;
  const qrUrl = `${window.location.origin}/1stmid-qr-code.png`;
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
      size: 62mm 100mm;
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
    body { width: 62mm; }
    .label {
      width: 62mm;
      height: 100mm;
      padding: 2.7mm 3mm 2.5mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #fff;
    }
    .brand {
      display: grid;
      grid-template-columns: 18mm 1fr;
      gap: 2.2mm;
      align-items: center;
      padding-bottom: 2mm;
      border-bottom: 0.45mm solid #000;
    }
    .logo {
      width: 17.5mm;
      height: 17.5mm;
      object-fit: contain;
      filter: grayscale(1) contrast(1.15);
    }
    .brand-copy { min-width: 0; }
    .brand-title {
      margin: 0;
      font-size: 14pt;
      font-weight: 900;
      line-height: 1;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }
    .site {
      margin-top: 1.2mm;
      padding-top: 1mm;
      border-top: 0.3mm solid #000;
      font-size: 8pt;
      font-weight: 800;
    }
    .destination {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 19mm;
      gap: 2mm;
      margin-top: 2.4mm;
      align-items: start;
    }
    .ship-to {
      font-size: 7pt;
      font-weight: 900;
      letter-spacing: 1px;
      margin-bottom: 1mm;
    }
    .name {
      font-size: 11pt;
      font-weight: 900;
      line-height: 1.08;
      overflow-wrap: anywhere;
      margin-bottom: 1mm;
    }
    .address {
      font-size: 8.8pt;
      font-weight: 700;
      line-height: 1.2;
      overflow-wrap: anywhere;
      margin-top: 0.45mm;
    }
    .country {
      font-size: 8.5pt;
      font-weight: 900;
      line-height: 1.15;
      text-transform: uppercase;
      margin-top: 0.8mm;
    }
    .qr-wrap { text-align: center; }
    .qr {
      display: block;
      width: 18mm;
      height: 18mm;
      margin: 0 auto;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .slogan {
      margin-top: 1mm;
      font-size: 5.8pt;
      line-height: 1.13;
      font-weight: 800;
      text-align: center;
    }
    .order {
      margin-top: 3mm;
      padding-bottom: 2mm;
      border-bottom: 0.4mm solid #000;
      font-size: 9.5pt;
      font-weight: 800;
    }
    .bottom {
      margin-top: auto;
      display: grid;
      gap: 1mm;
    }
    .store-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 2mm;
    }
    .store-name {
      font-size: 10.5pt;
      font-weight: 900;
      letter-spacing: 0.15px;
      white-space: nowrap;
    }
    .thanks {
      font-size: 7pt;
      font-weight: 800;
      text-align: right;
      white-space: nowrap;
    }
    .community {
      font-size: 6.8pt;
      font-weight: 800;
      line-height: 1.1;
      text-align: center;
      letter-spacing: 0.05px;
    }
    .screen-note { display: none; }
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
        box-shadow: 0 8px 28px rgba(0,0,0,.18);
      }
      .screen-note {
        display: block;
        width: min(62mm, calc(100vw - 32px));
        margin: 12px auto 0;
        font-size: 12px;
        line-height: 1.35;
        color: #333;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <main class="label">
    <header class="brand">
      <img class="logo" src="${logoUrl}" alt="Mobile Infantry 1st Division logo" />
      <div class="brand-copy">
        <p class="brand-title">1ST M.I.</p>
        <div class="site">1stmid.com</div>
      </div>
    </header>

    <section class="destination">
      <div>
        <div class="ship-to">SHIP TO</div>
        <div class="name">${customerName || "CUSTOMER"}</div>
        ${street ? `<div class="address">${street}</div>` : ""}
        ${localityLine ? `<div class="address">${localityLine}</div>` : ""}
        ${country ? `<div class="country">${country}</div>` : ""}
      </div>
      <div class="qr-wrap">
        <img class="qr" src="${qrUrl}" alt="1stmid.com QR code" />
        <div class="slogan">No One Stacks Them High,<br />Like The 1st M.I.</div>
      </div>
    </section>

    <div class="order">Order #${orderNumber}</div>

    <footer class="bottom">
      <div class="store-row">
        <span class="store-name">1ST M.I. STORE</span>
        <span class="thanks">Thank you<br />FOR YOUR SUPPORT</span>
      </div>
      <div class="community">Friendship - Good Vibes - Community</div>
    </footer>
  </main>
  <p class="screen-note">Brother QL-700 test settings: select a 62 mm continuous roll, Portrait, Actual Size / 100%, margins None, and turn browser headers and footers off.</p>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 250);
    });
  </script>
</body>
</html>`);
  printWindow.document.close();
}
