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
  if (length > 34) return small;
  if (length > 24) return medium;
  return normal;
}

export function printStoreAddressLabel(order: StoreOrder): void {
  const printWindow = window.open("", "_blank", "width=1100,height=700");
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

  const namePt = fittedPt(rawCustomerName, 10.5, 9.2, 8.1);
  const streetPt = fittedPt(rawStreet, 8.4, 7.4, 6.6);
  const localityPt = fittedPt(localityRaw, 8.4, 7.4, 6.6);
  const countryPt = fittedPt(rawCountry, 8.1, 7.2, 6.5);

  const logoUrl = `${window.location.origin}/ql700-mi-logo-print-ready.svg`;
  const qrUrl = `${window.location.origin}/1stmid-qr-code.png`;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${orderNumber} Address Label</title>
  <style>
    @page { size: 120mm 62mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #080808; font-family: Arial, Helvetica, sans-serif; }
    .label { position: relative; width: 120mm; height: 62mm; overflow: hidden; background: #fff; border: 0.7mm solid #0a0a0a; clip-path: polygon(1.5mm 0, calc(100% - 1.5mm) 0, 100% 1.5mm, 100% calc(100% - 1.5mm), calc(100% - 1.5mm) 100%, 1.5mm 100%, 0 calc(100% - 1.5mm), 0 1.5mm); }
    .concept-row { position: absolute; left: 1.5mm; right: 1.5mm; top: 1.4mm; height: 7.1mm; display: flex; align-items: center; padding: 0 2.3mm; border: 0.45mm solid #0a0a0a; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-size: 11pt; font-weight: 900; letter-spacing: 0.25mm; white-space: nowrap; }
    .concept-chevron { margin-left: auto; font-size: 15pt; letter-spacing: -0.4mm; transform: skewX(-12deg); }
    .brand-row { position: absolute; left: 1.5mm; right: 1.5mm; top: 9mm; height: 7.1mm; display: grid; grid-template-columns: 41mm 1fr; align-items: center; background: #0a0a0a; color: #fff; padding: 0 2.5mm; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-weight: 900; letter-spacing: 0.2mm; }
    .brand-store { font-size: 10.5pt; white-space: nowrap; }
    .brand-values { text-align: right; font-size: 7.2pt; letter-spacing: 0.25mm; white-space: nowrap; }
    .main-row { position: absolute; left: 1.5mm; right: 1.5mm; top: 16.7mm; height: 26.8mm; border-left: 0.4mm solid #0a0a0a; border-right: 0.4mm solid #0a0a0a; border-bottom: 0.45mm solid #0a0a0a; }
    .emblem-box { position: absolute; left: 0; top: 0; width: 32mm; height: 26.8mm; display: grid; place-items: center; border-right: 0.45mm solid #0a0a0a; }
    .logo { width: 26.2mm; height: 24.8mm; object-fit: contain; }
    .address-box { position: absolute; left: 32mm; top: 0; width: 54.2mm; height: 26.8mm; padding: 2.2mm 3.6mm 1.8mm; border-right: 0.45mm solid #0a0a0a; }
    .ship-to { margin: 0 0 1.2mm; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-size: 12pt; font-weight: 900; letter-spacing: 0.3mm; line-height: 1; }
    .name { margin: 0 0 0.8mm; font-weight: 900; line-height: 1.02; white-space: nowrap; }
    .address-line { margin-top: 0.8mm; font-weight: 800; line-height: 1.02; white-space: nowrap; }
    .country { text-transform: uppercase; }
    .qr-box { position: absolute; left: 86.2mm; right: 0; top: 0; height: 26.8mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5mm 1.5mm 1.2mm; }
    .qr { width: 19.2mm; height: 19.2mm; object-fit: contain; image-rendering: pixelated; }
    .order { margin-top: 0.9mm; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-size: 7.2pt; font-weight: 900; letter-spacing: 0.08mm; white-space: nowrap; }
    .message-row { position: absolute; left: 1.5mm; right: 1.5mm; top: 43.5mm; height: 10.1mm; display: grid; grid-template-columns: 27.8mm 1fr 31.8mm; border-left: 0.4mm solid #0a0a0a; border-right: 0.4mm solid #0a0a0a; border-bottom: 0.45mm solid #0a0a0a; }
    .site-box { display: flex; align-items: center; padding: 0 2.2mm; border-right: 0.45mm solid #0a0a0a; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-size: 10.5pt; font-weight: 900; white-space: nowrap; }
    .slogan-box { display: flex; align-items: center; justify-content: center; padding: 0 1.5mm; border-right: 0.45mm solid #0a0a0a; font-family: "Arial Narrow", Arial, sans-serif; font-size: 7.4pt; font-weight: 900; font-style: italic; white-space: nowrap; }
    .supply-box { position: relative; display: flex; align-items: center; padding-left: 2.7mm; padding-right: 9mm; background: #0a0a0a; color: #fff; font-family: Impact, "Arial Narrow", Arial, sans-serif; font-size: 7.2pt; font-weight: 900; line-height: 1.06; letter-spacing: 0.14mm; }
    .supply-stripes { position: absolute; right: 2.1mm; top: 1.4mm; width: 5.5mm; height: 7.2mm; background: repeating-linear-gradient(120deg, #fff 0 1.4mm, transparent 1.4mm 3mm); }
    .footer-row { position: absolute; left: 1.5mm; right: 1.5mm; bottom: 1.5mm; height: 6.7mm; display: flex; align-items: center; justify-content: center; border: 0.4mm solid #0a0a0a; font-family: "Arial Narrow", Arial, sans-serif; font-size: 7pt; font-weight: 900; letter-spacing: 0.55mm; white-space: nowrap; }
    .footer-stripes { position: absolute; width: 14mm; height: 5.2mm; top: 0.7mm; background: repeating-linear-gradient(120deg, #0a0a0a 0 2.2mm, transparent 2.2mm 4.6mm); }
    .footer-stripes.left { left: 1.8mm; }
    .footer-stripes.right { right: 1.8mm; transform: scaleX(-1); }
    .screen-note { display: none; }
    @media screen { body { min-height: 100vh; display: grid; place-items: start center; padding: 24px; background: #e9e9e9; } .label { box-shadow: 0 10px 32px rgba(0,0,0,.22); } .screen-note { display: block; width: min(120mm, calc(100vw - 32px)); margin: 12px auto 0; color: #222; font-size: 12px; line-height: 1.4; text-align: center; } }
  </style>
</head>
<body>
  <main class="label">
    <div class="concept-row"><span>DESIGN 18 - FIELD-MANUAL STYLE</span><span class="concept-chevron">////</span></div>
    <div class="brand-row"><div class="brand-store">1ST M.I. STORE &nbsp;››</div><div class="brand-values">SUPPLY | COMMUNITY | GOOD VIBES</div></div>
    <section class="main-row">
      <div class="emblem-box"><img class="logo" src="${logoUrl}" alt="Mobile Infantry 1st Division emblem" /></div>
      <div class="address-box">
        <div class="ship-to">SHIP TO:</div>
        <div class="name" style="font-size:${namePt}pt">${customerName || "CUSTOMER"}</div>
        ${street ? `<div class="address-line" style="font-size:${streetPt}pt">${street}</div>` : ""}
        ${localityLine ? `<div class="address-line" style="font-size:${localityPt}pt">${localityLine}</div>` : ""}
        ${country ? `<div class="address-line country" style="font-size:${countryPt}pt">${country}</div>` : ""}
      </div>
      <div class="qr-box"><img class="qr" src="${qrUrl}" alt="1stmid.com QR code" /><div class="order">Order #${orderNumber}</div></div>
    </section>
    <section class="message-row">
      <div class="site-box">1stmid.com</div>
      <div class="slogan-box">“No One Stacks Them High, Like The 1st M.I.”</div>
      <div class="supply-box"><span>M.I. SUPPLY<br />FOR A BRIGHTER<br />TOMORROW</span><span class="supply-stripes" aria-hidden="true"></span></div>
    </section>
    <footer class="footer-row"><span class="footer-stripes left" aria-hidden="true"></span><span>Friendship - Good Vibes - Community</span><span class="footer-stripes right" aria-hidden="true"></span></footer>
  </main>
  <p class="screen-note">Brother QL-700 settings: 62 mm continuous roll, label length 120 mm, Landscape, Actual Size / 100%, margins None, browser headers and footers off.</p>
  <script>
    window.addEventListener('load', function () {
      var images = Array.from(document.images);
      Promise.all(images.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      })).then(function () { setTimeout(function () { window.print(); }, 200); });
    });
  </script>
</body>
</html>`);
  printWindow.document.close();
}
