import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, Eye, Link2, Mail, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildTrackedStoreEmailHtml,
  trackedStoreEmailPlainText,
  trackedStoreEmailSubject,
  type TrackedStoreEmailExtras,
} from "@/lib/store-email-tracking-template";
import { sendLeadershipStoreEmail } from "@/lib/store-email-send-fn";
import {
  ensureLeadershipStoreOrderTrackingLink,
  saveLeadershipStoreOrderTrackingDetails,
} from "@/lib/store-order-tracking-fn";
import { fetchLeadershipStoreSettings } from "@/lib/store-settings-fn";
import type { StoreOrder } from "@/lib/store-orders";
import type { StoreEmailType } from "@/lib/store-email-template";

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

export function StoreEmailTrackingBuilder({ order }: { order: StoreOrder }) {
  const [emailType, setEmailType] = useState<StoreEmailType>(() => emailTypeForOrder(order));
  const [emailMessage, setEmailMessage] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetchLeadershipStoreSettings().catch(() => null),
      ensureLeadershipStoreOrderTrackingLink({ data: { orderId: order.id } }).catch(() => null),
    ]).then(([settings, access]) => {
      if (cancelled) return;

      if (settings) {
        const images: Record<string, string> = {};
        for (const product of settings.products) {
          const image = product.images[0]?.url || product.image;
          if (image) images[product.id] = image;
        }
        setProductImages(images);
      }

      if (access) {
        setTrackingUrl(access.url);
        setTrackingNumber(access.trackingNumber || "");
        setEstimatedDelivery(access.estimatedDelivery || "");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [order.id]);

  const extras = useMemo<TrackedStoreEmailExtras>(
    () => ({
      type: emailType,
      message: emailMessage,
      trackingNumber,
      estimatedDelivery,
      productImages,
      trackingUrl,
    }),
    [emailType, emailMessage, estimatedDelivery, productImages, trackingNumber, trackingUrl],
  );

  const subject = useMemo(() => trackedStoreEmailSubject(order, extras), [order, extras]);

  async function saveTracking(showNotice = true) {
    setSavingTracking(true);
    if (showNotice) setNotice(null);
    try {
      const saved = await saveLeadershipStoreOrderTrackingDetails({
        data: {
          orderId: order.id,
          trackingNumber,
          estimatedDelivery,
        },
      });
      setTrackingUrl(saved.url);
      setTrackingNumber(saved.trackingNumber || "");
      setEstimatedDelivery(saved.estimatedDelivery || "");
      if (showNotice) setNotice("Tracking details saved. The customer order page is up to date.");
      return saved;
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not save tracking details.";
      if (showNotice) setNotice(text);
      throw error;
    } finally {
      setSavingTracking(false);
    }
  }

  async function ensureTrackingAccess() {
    if (trackingUrl) {
      return {
        url: trackingUrl,
        trackingNumber,
        estimatedDelivery,
      };
    }
    const access = await ensureLeadershipStoreOrderTrackingLink({ data: { orderId: order.id } });
    setTrackingUrl(access.url);
    if (!trackingNumber && access.trackingNumber) setTrackingNumber(access.trackingNumber);
    if (!estimatedDelivery && access.estimatedDelivery) setEstimatedDelivery(access.estimatedDelivery);
    return access;
  }

  async function buildCurrentEmail() {
    const saved = await saveTracking(false);
    const currentExtras: TrackedStoreEmailExtras = {
      ...extras,
      trackingUrl: saved.url,
      trackingNumber: saved.trackingNumber,
      estimatedDelivery: saved.estimatedDelivery,
    };
    return {
      subject: trackedStoreEmailSubject(order, currentExtras),
      html: buildTrackedStoreEmailHtml(order, currentExtras),
      text: trackedStoreEmailPlainText(order, currentExtras),
    };
  }

  async function sendCustomerEmail() {
    if (sending) return;
    const approved = window.confirm(
      `Send this email now to ${order.customer.email} from merch@1stmid.com?`,
    );
    if (!approved) return;

    setSending(true);
    setNotice(null);
    try {
      const current = await buildCurrentEmail();
      const sent = await sendLeadershipStoreEmail({
        data: {
          to: order.customer.email,
          subject: current.subject,
          text: current.text,
          html: current.html,
        },
      });
      setNotice(
        `Email sent successfully from ${sent.from} to ${order.customer.email}${sent.id ? ` · Resend ID ${sent.id}` : ""}.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? `Could not send email: ${error.message}` : "Could not send the email.");
    } finally {
      setSending(false);
    }
  }

  async function copyCustomerEmail() {
    setCopying(true);
    setNotice(null);
    try {
      const current = await buildCurrentEmail();

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        const item = new ClipboardItem({
          "text/html": new Blob([current.html], { type: "text/html" }),
          "text/plain": new Blob([current.text], { type: "text/plain" }),
        });
        await navigator.clipboard.write([item]);
        setNotice("Branded tracking email copied. Paste it into any email app with Ctrl+V.");
      } else {
        await navigator.clipboard.writeText(current.text);
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

  async function copyTrackingLink() {
    setNotice(null);
    try {
      const access = await ensureTrackingAccess();
      await navigator.clipboard.writeText(access.url);
      setNotice("Customer tracking link copied.");
    } catch (error) {
      setNotice(error instanceof Error ? `Could not copy tracking link: ${error.message}` : "Could not copy tracking link.");
    }
  }

  async function previewCustomerEmail() {
    setNotice(null);
    try {
      const access = await ensureTrackingAccess();
      const currentExtras: TrackedStoreEmailExtras = {
        ...extras,
        trackingUrl: access.url,
      };
      const currentHtml = buildTrackedStoreEmailHtml(order, currentExtras);
      const blob = new Blob([currentHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not preview email: ${error.message}` : "Could not preview the email.");
    }
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
          <h2 className="font-display text-2xl font-semibold uppercase text-fg">Customer Email & Tracking</h2>
          <p className="mt-1 text-xs text-muted">
            Build and send a branded email directly from the Store Manager. Messages are delivered through Resend as merch@1stmid.com, and replies return to the domain mailbox.
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
              placeholder="Optional until the parcel is shipped"
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

        <div className="rounded-md border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="stencil text-[9px] tracking-[0.12em] text-primary">Customer tracking page</p>
              <p className="mt-1 break-all text-sm leading-relaxed text-fg">
                {trackingUrl || "Creating secure tracking link…"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                This link is unique to the order. It shows customer-safe order progress and does not expose leadership controls, payment references, email, phone number, or the full street address.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-black/25 p-4">
          <p className="stencil text-[9px] tracking-[0.12em] text-primary">From</p>
          <p className="mt-1 text-sm text-fg">1st M.I. Merchandise · merch@1stmid.com</p>

          <p className="mt-4 stencil text-[9px] tracking-[0.12em] text-primary">Email to</p>
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
          <Button type="button" disabled={sending || savingTracking} onClick={() => void sendCustomerEmail()}>
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send Email"}
          </Button>

          <Button type="button" variant="secondary" disabled={copying || sending} onClick={() => void copyCustomerEmail()}>
            <Copy className="h-4 w-4" />
            {copying ? "Copying…" : "Copy Email"}
          </Button>

          <Button type="button" variant="secondary" onClick={() => void previewCustomerEmail()}>
            <Eye className="h-4 w-4" /> Preview Email
          </Button>

          <Button type="button" variant="secondary" disabled={savingTracking || sending} onClick={() => void saveTracking()}>
            <Save className="h-4 w-4" /> {savingTracking ? "Saving…" : "Save Tracking"}
          </Button>

          <Button type="button" variant="secondary" onClick={() => void copyTrackingLink()}>
            <Link2 className="h-4 w-4" /> Copy Tracking Link
          </Button>

          <Button type="button" variant="secondary" onClick={() => void copySubject()}>
            <Copy className="h-4 w-4" /> Copy Subject
          </Button>

          <Button type="button" variant="secondary" onClick={openEmailApp}>
            <Mail className="h-4 w-4" /> Open Email App
          </Button>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Send Email saves the latest tracking details first, builds the current branded order email, then sends it through Resend from merch@1stmid.com. Copy Email and Open Email App remain available as fallbacks.
        </p>
      </div>
    </section>
  );
}
