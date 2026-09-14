import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildStoreEmailHtml,
  storeEmailPlainText,
  storeEmailSubject,
  type StoreEmailType,
} from "@/lib/store-email-template";
import { fetchLeadershipStoreSettings } from "@/lib/store-settings-fn";
import type { StoreOrder } from "@/lib/store-orders";

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function emailTypeForOrder(order: StoreOrder): StoreEmailType {
  switch (order.status) {
    case "paid":
      return "paid";
    case "approved":
      return "approved";
    case "packing":
      return "packing";
    case "shipped":
      return "shipped";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "confirmed";
  }
}

export function StoreEmailBuilder({ order }: { order: StoreOrder }) {
  const [emailType, setEmailType] = useState<StoreEmailType>(() => emailTypeForOrder(order));
  const [emailMessage, setEmailMessage] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchLeadershipStoreSettings()
      .then((settings) => {
        if (cancelled) return;
        const images: Record<string, string> = {};
        for (const product of settings.products) {
          const image = product.images[0]?.url || product.image;
          if (image) images[product.id] = image;
        }
        setProductImages(images);
      })
      .catch(() => {
        // The email still works without product images.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const extras = useMemo(
    () => ({
      type: emailType,
      message: emailMessage,
      trackingNumber,
      estimatedDelivery,
      productImages,
    }),
    [emailType, emailMessage, estimatedDelivery, productImages, trackingNumber],
  );

  const subject = useMemo(() => storeEmailSubject(order, extras), [order, extras]);
  const html = useMemo(() => buildStoreEmailHtml(order, extras), [order, extras]);
  const plainText = useMemo(() => storeEmailPlainText(order, extras), [order, extras]);

  async function copyCustomerEmail() {
    setCopying(true);
    setNotice(null);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
        setNotice("Branded email copied. Paste it into Outlook with Ctrl+V.");
      } else {
        await navigator.clipboard.writeText(plainText);
        setNotice("Your browser copied the plain-text version because rich clipboard copy is not supported.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? `Could not copy email: ${error.message}` : "Could not copy the email.");
    } finally {
      setCopying(false);
    }
  }

  async function copySubject() {
    setNotice(null);
    try {
      await navigator.clipboard.writeText(subject);
      setNotice("Email subject copied.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not copy subject: ${error.message}` : "Could not copy the subject.");
    }
  }

  function previewCustomerEmail() {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function openEmailApp() {
    const href = `mailto:${encodeURIComponent(order.customer.email)}?subject=${encodeURIComponent(subject)}`;
    window.location.href = href;
  }

  return (
    <section className="panel panel-feature p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-display text-2xl font-semibold uppercase text-fg">Customer Email</h2>
          <p className="mt-1 text-xs text-muted">
            Build a branded 1st M.I. Store email from this existing order, then copy and paste it into Outlook.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="stencil text-[9px] tracking-[0.12em] text-primary">Email type</span>
          <select
            className={inputClass}
            value={emailType}
            onChange={(event) => setEmailType(event.target.value as StoreEmailType)}
          >
            <option value="confirmed">Order Confirmed</option>
            <option value="paid">Payment Confirmed</option>
            <option value="approved">Order Approved</option>
            <option value="packing">Packing / Preparing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="stencil text-[9px] tracking-[0.12em] text-primary">Custom message</span>
          <textarea
            rows={4}
            value={emailMessage}
            onChange={(event) => setEmailMessage(event.target.value)}
            placeholder="Optional — leave blank to use the automatic message for the selected email type."
            className="w-full rounded-md border border-border-strong bg-black/45 px-3 py-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="stencil text-[9px] tracking-[0.12em] text-primary">Tracking number</span>
            <input
              className={inputClass}
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label className="grid gap-2">
            <span className="stencil text-[9px] tracking-[0.12em] text-primary">Estimated delivery</span>
            <input
              className={inputClass}
              value={estimatedDelivery}
              onChange={(event) => setEstimatedDelivery(event.target.value)}
              placeholder="e.g. 18–22 September 2026"
            />
          </label>
        </div>

        <div className="rounded-md border border-border bg-black/25 p-4">
          <p className="stencil text-[9px] tracking-[0.12em] text-primary">Email to</p>
          <p className="mt-1 break-all text-sm text-fg">{order.customer.email}</p>

          <p className="mt-4 stencil text-[9px] tracking-[0.12em] text-primary">Subject</p>
          <p className="mt-1 text-sm leading-relaxed text-fg">{subject}</p>
        </div>

        {notice ? (
          <div className="flex items-start gap-2 rounded-md border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={copying} onClick={() => void copyCustomerEmail()}>
            <Copy className="h-4 w-4" />
            {copying ? "Copying…" : "Copy Email"}
          </Button>

          <Button type="button" variant="secondary" onClick={previewCustomerEmail}>
            <Eye className="h-4 w-4" /> Preview Email
          </Button>

          <Button type="button" variant="secondary" onClick={() => void copySubject()}>
            <Copy className="h-4 w-4" /> Copy Subject
          </Button>

          <Button type="button" variant="secondary" onClick={openEmailApp}>
            <Mail className="h-4 w-4" /> Open Outlook / Email App
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Recommended workflow: Preview Email → Copy Email → Open Outlook / Email App → paste with Ctrl+V. Product images are pulled from the current Store Manager where available.
        </p>
      </div>
    </section>
  );
}
