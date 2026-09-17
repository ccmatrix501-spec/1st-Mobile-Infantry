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

function fittedPt(value: string, normal: number, medium: number, small: number): number {
  const length = value.trim().length;
  if (length > 38) return small;
  if (length > 27) return medium;
  return normal;
}

export function printStoreAddressLabel(order: StoreOrder): void {
  const printWindow = window.open("", "_blank", "width=1250,height=700");
  if (!printWindow) {
    throw new Error("The label window was blocked. Allow pop-ups for 1stmid.com and try again.");
  }

  const rawCustomerName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const rawStreet = order.shippingAddress.address.trim();
  const rawCity = order.shippingAddress.city.trim();
  const rawState = order.shippingAddress.state.trim();
  const rawPostcode = order.shippingAddress.postalCode.trim();
  const rawCountry = order.shippingAddress.country.trim();

  const customerName = clean(rawCustomerName);
  const street = clean(rawStreet);
  const country = clean(rawCountry);
  const orderNumber = clean(order.orderNumber);
  const localityRaw = [rawCity, rawState, rawPostcode].filter(Boolean).join(" ");
  const localityLine = clean(localityRaw);

  const namePt = fittedPt(rawCustomerName, 12.5, 10.8, 9.2);
  const streetPt = fittedPt(rawStreet, 10.2, 8.8, 7.5);
  const localityPt = fittedPt(localityRaw, 10.2, 8.8, 7.5);
  const countryPt = fittedPt(rawCountry, 9.8, 8.4, 7.2);

  const logoUrl = `${window.location.origin}/ql700-mi-logo-print-ready.svg`;
  const qrUrl = `${window.location.origin}/1stmid-qr-code.png?v=20260918`;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${orderNumber} Address Label</title>
  <style>
    @page { size: 140mm 62mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #080808;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      position: relative;
      width: 140mm;
      height: 62mm;
      overflow: hidden;
      background: #fff;
      border: 0.75mm solid #0a0a0a;
      clip-path: polygon(1.5mm 0, calc(100% - 1.5mm) 0, 100% 1.5mm, 100% calc(100% - 1.5mm), calc(100% - 1.5mm) 100%, 1.5mm 100%, 0 calc(100% - 1.5mm), 0 1.5mm);
    }
    .brand-row {
      position: absolute;
      left: 1.6mm;
      right: 1.6mm;
      top: 1.6mm;
      height: 7.8mm;
      display: grid;
      grid-template-columns: 48mm 1fr;
      align-items: center;
      background: #090909;
      color: #fff;
      padding: 0 3mm;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-weight: 900;
      letter-spacing: 0.18mm;
    }
    .brand-store {
      position: relative;
      font-size: 13pt;
      white-space: nowrap;
    }
    .brand-store::after {
      content: "»";
      margin-left: 3mm;
      font-size: 15pt;
    }
    .brand-values {
      text-align: right;
      font-size: 8.2pt;
      letter-spacing: 0.3mm;
      white-space: nowrap;
    }
    .main-row {
      position: absolute;
      left: 1.6mm;
      right: 1.6mm;
      top: 9.9mm;
      height: 31.7mm;
      border-left: 0.45mm solid #0a0a0a;
      border-right: 0.45mm solid #0a0a0a;
      border-bottom: 0.55mm solid #0a0a0a;
    }
    .emblem-box {
      position: absolute;
      left: 0;
      top: 0;
      width: 38mm;
      height: 31.7mm;
      display: grid;
      place-items: center;
      border-right: 0.55mm solid #0a0a0a;
    }
    .logo {
      width: 32.5mm;
      height: 29.5mm;
      object-fit: contain;
    }
    .address-box {
      position: absolute;
      left: 38mm;
      top: 0;
      width: 64mm;
      height: 31.7mm;
      padding: 2.4mm 4mm 1.5mm;
      border-right: 0.55mm solid #0a0a0a;
    }
    .ship-to {
      margin: 0 0 1.5mm;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 0.25mm;
      line-height: 1;
    }
    .name {
      margin: 0 0 0.7mm;
      font-weight: 900;
      line-height: 1.02;
      white-space: nowrap;
    }
    .address-line {
      margin-top: 0.65mm;
      font-weight: 800;
      line-height: 1.02;
      white-space: nowrap;
    }
    .country { text-transform: uppercase; }
    .qr-box {
      position: absolute;
      left: 102mm;
      right: 0;
      top: 0;
      height: 31.7mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0.8mm 1.4mm 1mm;
      background: #fff;
    }
    .qr-wrap {
      width: 24.8mm;
      height: 24.8mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.2mm;
      background: #fff;
      overflow: hidden;
    }
    .qr {
      display: block;
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      background: #fff;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    .order {
      margin-top: 0.7mm;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 8.7pt;
      font-weight: 900;
      letter-spacing: 0.04mm;
      white-space: nowrap;
    }
    .message-row {
      position: absolute;
      left: 1.6mm;
      right: 1.6mm;
      top: 41.6mm;
      height: 11.5mm;
      display: grid;
      grid-template-columns: 32mm 1fr 36mm;
      border-left: 0.45mm solid #0a0a0a;
      border-right: 0.45mm solid #0a0a0a;
      border-bottom: 0.55mm solid #0a0a0a;
    }
    .site-box {
      display: flex;
      align-items: center;
      padding: 0 3mm;
      border-right: 0.55mm solid #0a0a0a;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 13pt;
      font-weight: 900;
      white-space: nowrap;
    }
    .slogan-box {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 2mm;
      border-right: 0.55mm solid #0a0a0a;
      font-family: "Arial Narrow", Arial, sans-serif;
      font-size: 9pt;
      font-weight: 900;
      font-style: italic;
      white-space: nowrap;
    }
    .supply-box {
      position: relative;
      display: flex;
      align-items: center;
      padding-left: 3mm;
      padding-right: 10mm;
      background: #090909;
      color: #fff;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 8.4pt;
      font-weight: 900;
      line-height: 1.03;
      letter-spacing: 0.1mm;
    }
    .supply-stripes {
      position: absolute;
      right: 2.2mm;
      top: 1.3mm;
      width: 6.5mm;
      height: 8.8mm;
      background: repeating-linear-gradient(120deg, #fff 0 1.7mm, transparent 1.7mm 3.5mm);
    }
    .footer-row {
      position: absolute;
      left: 1.6mm;
      right: 1.6mm;
      bottom: 1.6mm;
      height: 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 0.45mm solid #0a0a0a;
      font-family: "Arial Narrow", Arial, sans-serif;
      font-size: 8.1pt;
      font-weight: 900;
      letter-spacing: 0.65mm;
      white-space: nowrap;
    }
    .footer-stripes {
      position: absolute;
      width: 15mm;
      height: 5.5mm;
      top: 0.65mm;
      background: repeating-linear-gradient(120deg, #0a0a0a 0 2.3mm, transparent 2.3mm 4.8mm);
    }
    .footer-stripes.left { left: 2mm; }
    .footer-stripes.right { right: 2mm; transform: scaleX(-1); }
    .screen-note { display: none; }
    @media screen {
      body {
        min-height: 100vh;
        display: grid;
        place-items: start center;
        padding: 24px;
        background: #e9e9e9;
      }
      .label { box-shadow: 0 10px 32px rgba(0,0,0,.22); }
      .screen-note {
        display: block;
        width: min(140mm, calc(100vw - 32px));
        margin: 12px auto 0;
        color: #222;
        font-size: 12px;
        line-height: 1.4;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <main class="label">
    <div class="brand-row">
      <div class="brand-store">1ST M.I. STORE</div>
      <div class="brand-values">SUPPLY | COMMUNITY | GOOD VIBES</div>
    </div>

    <section class="main-row">
      <div class="emblem-box">
        <img class="logo" src="${logoUrl}" alt="Mobile Infantry 1st Division emblem" />
      </div>
      <div class="address-box">
        <div class="ship-to">SHIP TO:</div>
        <div class="name" style="font-size:${namePt}pt">${customerName || "CUSTOMER"}</div>
        ${street ? `<div class="address-line" style="font-size:${streetPt}pt">${street}</div>` : ""}
        ${localityLine ? `<div class="address-line" style="font-size:${localityPt}pt">${localityLine}</div>` : ""}
        ${country ? `<div class="address-line country" style="font-size:${countryPt}pt">${country}</div>` : ""}
      </div>
      <div class="qr-box">
        <div class="qr-wrap">
          <img class="qr" src="${qrUrl}" alt="1stmid.com QR code" />
        </div>
        <div class="order">Order #${orderNumber}</div>
      </div>
    </section>

    <section class="message-row">
      <div class="site-box">1stmid.com</div>
      <div class="slogan-box">“No One Stacks Them High, Like The 1st M.I.”</div>
      <div class="supply-box">
        <span>M.I. SUPPLY<br />FOR A BRIGHTER<br />TOMORROW</span>
        <span class="supply-stripes" aria-hidden="true"></span>
      </div>
    </section>

    <footer class="footer-row">
      <span class="footer-stripes left" aria-hidden="true"></span>
      <span>Friendship - Good Vibes - Community</span>
      <span class="footer-stripes right" aria-hidden="true"></span>
    </footer>
  </main>

  <p class="screen-note">Brother QL-700 settings: 62 mm continuous roll, label length 140 mm, Landscape, Actual Size / 100%, margins None, browser headers and footers off.</p>
  <script>
    window.addEventListener('load', function () {
      var images = Array.from(document.images);
      Promise.all(images.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })).then(function () { setTimeout(function () { window.print(); }, 250); });
    });
  </script>
</body>
</html>`);
  printWindow.document.close();
}
