import type { StoreReturnAddress } from "@/lib/store-return-address";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clean(value: string): string {
  return escapeHtml(value.trim());
}

export function printStoreReturnAddressLabel(address: StoreReturnAddress): void {
  const printWindow = window.open("", "_blank", "width=760,height=650");
  if (!printWindow) {
    throw new Error("The label window was blocked. Allow pop-ups for 1stmid.com and try again.");
  }

  const name = clean(address.name);
  const street = clean(address.address);
  const locality = clean(
    [address.city, address.state, address.postalCode].map((part) => part.trim()).filter(Boolean).join(" "),
  );
  const country = clean(address.country);
  const logoUrl = `${window.location.origin}/ql700-mi-logo-print-ready.svg`;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>1st M.I. Return Address Label</title>
  <style>
    @page { size: 62mm 45mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #070707;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      position: relative;
      width: 62mm;
      height: 45mm;
      overflow: hidden;
      border: 0.45mm solid #080808;
      background: #fff;
    }
    .header {
      position: absolute;
      left: 1.3mm;
      right: 1.3mm;
      top: 1.3mm;
      height: 7.3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #080808;
      color: #fff;
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 7.4pt;
      font-weight: 900;
      letter-spacing: 0.1mm;
      white-space: nowrap;
    }
    .logo-box {
      position: absolute;
      left: 2.3mm;
      top: 10.4mm;
      width: 18.5mm;
      height: 26.5mm;
      display: grid;
      place-items: center;
      border-right: 0.35mm solid #080808;
    }
    .logo {
      width: 17.2mm;
      height: 19mm;
      object-fit: contain;
    }
    .details {
      position: absolute;
      left: 23.2mm;
      right: 2.2mm;
      top: 10.5mm;
      bottom: 6.1mm;
      overflow: hidden;
    }
    .store {
      font-family: Impact, "Arial Black", "Arial Narrow", Arial, sans-serif;
      font-size: 9.2pt;
      font-weight: 900;
      line-height: 1;
    }
    .caption {
      margin-top: 1.1mm;
      font-size: 6.1pt;
      font-weight: 900;
      letter-spacing: 0.15mm;
    }
    .name {
      margin-top: 1.5mm;
      font-size: 7.4pt;
      font-weight: 900;
      line-height: 1.05;
      overflow-wrap: anywhere;
    }
    .line {
      margin-top: 0.75mm;
      font-size: 6.7pt;
      font-weight: 700;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }
    .country {
      font-weight: 900;
      text-transform: uppercase;
    }
    .site {
      position: absolute;
      left: 2mm;
      right: 2mm;
      bottom: 1.8mm;
      text-align: center;
      font-size: 6.5pt;
      font-weight: 900;
      letter-spacing: 0.12mm;
    }
    .screen-note { display: none; }
    @media screen {
      body {
        min-height: 100vh;
        display: grid;
        place-items: start center;
        padding: 24px;
        background: #e9e9e9;
      }
      .label { box-shadow: 0 10px 32px rgba(0,0,0,.2); }
      .screen-note {
        display: block;
        width: min(62mm, calc(100vw - 32px));
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
    <div class="header">IF UNDELIVERABLE - RETURN TO SENDER</div>
    <div class="logo-box">
      <img class="logo" src="${logoUrl}" alt="Mobile Infantry 1st Division emblem" />
    </div>
    <div class="details">
      <div class="store">1ST M.I. STORE</div>
      <div class="caption">RETURN ADDRESS</div>
      <div class="name">${name}</div>
      <div class="line">${street}</div>
      <div class="line">${locality}</div>
      <div class="line country">${country}</div>
    </div>
    <div class="site">www.1stmid.com</div>
  </main>
  <p class="screen-note">Brother QL-700: use 62 mm continuous roll, 45 mm label length, Actual Size / 100%, margins None, background graphics On.</p>
  <script>
    window.addEventListener("load", function () {
      var images = Array.from(document.images);
      Promise.all(images.map(function (img) {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(function (resolve) {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })).then(function () { setTimeout(function () { window.print(); }, 250); });
    });
  </script>
</body>
</html>`);
  printWindow.document.close();
}
