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
  const logoUrl = `${window.location.origin}/ql700-mi-logo-print-ready.svg`;
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
    @page { size: 62mm 85mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
    }
    .label {
      position: relative;
      width: 62mm;
      height: 85mm;
      overflow: hidden;
      background: #fff;
    }
    .logo {
      position: absolute;
      left: 3mm;
      top: 3mm;
      width: 17mm;
      height: 17mm;
      object-fit: contain;
      filter: grayscale(1) contrast(1.18);
    }
    .brand-title {
      position: absolute;
      left: 22mm;
      top: 5mm;
      margin: 0;
      font-size: 14pt;
      font-weight: 900;
      line-height: 1;
      white-space: nowrap;
    }
    .site {
      position: absolute;
      left: 22mm;
      right: 3mm;
      top: 12.8mm;
      padding-top: 1mm;
      border-top: 0.35mm solid #000;
      font-size: 8pt;
      font-weight: 800;
    }
    .top-line {
      position: absolute;
      left: 3mm;
      right: 3mm;
      top: 21.5mm;
      border-top: 0.45mm solid #000;
    }
    .ship-to {
      position: absolute;
      left: 3mm;
      top: 24.5mm;
      font-size: 7pt;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .name {
      position: absolute;
      left: 3mm;
      top: 29mm;
      width: 34mm;
      font-size: 11pt;
      font-weight: 900;
      line-height: 1.05;
      overflow-wrap: anywhere;
    }
    .address-block {
      position: absolute;
      left: 3mm;
      top: 35.5mm;
      width: 34mm;
      max-height: 19mm;
      overflow: hidden;
      font-size: 8.7pt;
      font-weight: 700;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }
    .address-block div { margin-bottom: 0.7mm; }
    .country {
      font-weight: 900;
      text-transform: uppercase;
      margin-top: 0.5mm;
    }
    .qr {
      position: absolute;
      left: 41mm;
      top: 25mm;
      width: 18mm;
      height: 18mm;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .slogan {
      position: absolute;
      left: 39.5mm;
      top: 44.3mm;
      width: 21mm;
      font-size: 5.6pt;
      line-height: 1.12;
      font-weight: 800;
      text-align: center;
    }
    .order {
      position: absolute;
      left: 3mm;
      right: 3mm;
      top: 57mm;
      padding-bottom: 2mm;
      border-bottom: 0.4mm solid #000;
      font-size: 9.5pt;
      font-weight: 800;
    }
    .store-name {
      position: absolute;
      left: 3mm;
      top: 65mm;
      font-size: 10.5pt;
      font-weight: 900;
      white-space: nowrap;
    }
    .thanks {
      position: absolute;
      right: 3mm;
      top: 64mm;
      font-size: 6.8pt;
      font-weight: 800;
      line-height: 1.05;
      text-align: right;
      white-space: nowrap;
    }
    .community {
      position: absolute;
      left: 3mm;
      right: 3mm;
      top: 75mm;
      font-size: 6.8pt;
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
    }
    .screen-note { display: none; }
    @media screen {
      body {
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
    <img class="logo" src="${logoUrl}" alt="Mobile Infantry 1st Division logo" />
    <p class="brand-title">1ST M.I.</p>
    <div class="site">1stmid.com</div>
    <div class="top-line"></div>

    <div class="ship-to">SHIP TO</div>
    <div class="name">${customerName || "CUSTOMER"}</div>
    <div class="address-block">
      ${street ? `<div>${street}</div>` : ""}
      ${localityLine ? `<div>${localityLine}</div>` : ""}
      ${country ? `<div class="country">${country}</div>` : ""}
    </div>

    <img class="qr" src="${qrUrl}" alt="1stmid.com QR code" />
    <div class="slogan">No One Stacks Them High,<br />Like The 1st M.I.</div>

    <div class="order">Order #${orderNumber}</div>
    <div class="store-name">1ST M.I. STORE</div>
    <div class="thanks">Thank you<br />FOR YOUR SUPPORT</div>
    <div class="community">Friendship - Good Vibes - Community</div>
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
