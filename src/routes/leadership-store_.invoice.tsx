import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  Plus,
  Printer,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { sendLeadershipStoreEmail } from "@/lib/store-email-send-fn";
import {
  fetchLeadershipStoreInvoice,
  saveLeadershipStoreInvoice,
} from "@/lib/store-invoice-fn";
import {
  buildStoreInvoiceHtml,
  invoiceTotals,
  storeInvoicePlainText,
  storeInvoiceSubject,
  type StoreInvoiceDraft,
  type StoreInvoiceStatus,
} from "@/lib/store-invoice";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-store_/invoice")({
  component: LeadershipStoreInvoicePage,
  head: () => ({ meta: [{ title: "Invoice Builder — 1st Mobile Infantry" }] }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass =
  "w-full rounded-md border border-border-strong bg-black/45 px-3 py-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function fieldLabel(label: string) {
  return <span className="stencil text-[9px] tracking-[0.12em] text-primary">{label}</span>;
}

function LeadershipStoreInvoicePage() {
  const [invoice, setInvoice] = useState<StoreInvoiceDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("orderId")?.trim() || "";
    if (!orderId) {
      setError("No order was supplied for this invoice.");
      setLoading(false);
      return;
    }

    void fetchLeadershipStoreInvoice({ data: { orderId } })
      .then((value) => setInvoice(value))
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Could not load the invoice.";
        if (text.toLowerCase().includes("session")) {
          const next = `/leadership-store/invoice?orderId=${encodeURIComponent(orderId)}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          return;
        }
        setError(text);
      })
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(
    () => (invoice ? invoiceTotals(invoice) : { subtotal: 0, shipping: 0, discount: 0, total: 0 }),
    [invoice],
  );

  function patch(value: Partial<StoreInvoiceDraft>) {
    setInvoice((current) => (current ? { ...current, ...value } : current));
  }

  function patchAddress(key: keyof StoreInvoiceDraft["billingAddress"], value: string) {
    setInvoice((current) =>
      current
        ? { ...current, billingAddress: { ...current.billingAddress, [key]: value } }
        : current,
    );
  }

  function patchLine(index: number, key: "description" | "quantity" | "unitPrice", value: string) {
    setInvoice((current) => {
      if (!current) return current;
      const lines = current.lines.map((line, lineIndex) => {
        if (lineIndex !== index) return line;
        if (key === "description") return { ...line, description: value };
        const number = Number(value);
        return {
          ...line,
          [key]: Number.isFinite(number) ? Math.max(key === "quantity" ? 1 : 0, number) : 0,
        };
      });
      return { ...current, lines };
    });
  }

  function addLine() {
    setInvoice((current) => {
      if (!current) return current;
      const id = globalThis.crypto?.randomUUID?.() || `line-${Date.now()}`;
      return {
        ...current,
        lines: [...current.lines, { id, description: "Custom item", quantity: 1, unitPrice: 0 }],
      };
    });
  }

  function removeLine(index: number) {
    setInvoice((current) => {
      if (!current || current.lines.length <= 1) return current;
      return { ...current, lines: current.lines.filter((_, lineIndex) => lineIndex !== index) };
    });
  }

  async function saveDraft(showNotice = true): Promise<StoreInvoiceDraft> {
    if (!invoice) throw new Error("Invoice is not loaded.");
    setSaving(true);
    if (showNotice) {
      setError(null);
      setNotice(null);
    }
    try {
      const saved = await saveLeadershipStoreInvoice({ data: invoice });
      setInvoice(saved);
      if (showNotice) setNotice("Invoice draft saved. Other Website Staff can reopen the same invoice from this order.");
      return saved;
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not save the invoice.";
      if (showNotice) setError(text);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function openPreview(current: StoreInvoiceDraft) {
    const html = buildStoreInvoiceHtml(current);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function previewInvoice() {
    setError(null);
    setNotice(null);
    try {
      const saved = await saveDraft(false);
      openPreview(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview the invoice.");
    }
  }

  async function printInvoice() {
    setError(null);
    setNotice(null);
    try {
      const saved = await saveDraft(false);
      const popup = window.open("", "_blank", "noopener,noreferrer");
      if (!popup) throw new Error("Your browser blocked the invoice print window. Allow pop-ups and try again.");
      popup.document.open();
      popup.document.write(buildStoreInvoiceHtml(saved));
      popup.document.close();
      popup.focus();
      window.setTimeout(() => popup.print(), 350);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the printable invoice.");
    }
  }

  async function sendInvoice() {
    if (!invoice || sending) return;
    const approved = window.confirm(
      `Send invoice ${invoice.invoiceNumber} now to ${invoice.customerEmail}?`,
    );
    if (!approved) return;

    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await saveDraft(false);
      const sent = await sendLeadershipStoreEmail({
        data: {
          to: saved.customerEmail,
          subject: storeInvoiceSubject(saved),
          text: storeInvoicePlainText(saved),
          html: buildStoreInvoiceHtml(saved),
          history: {
            orderId: saved.orderId,
            orderNumber: saved.orderNumber,
            recipientName: saved.customerName,
            emailType: "invoice",
            orderStatus: saved.orderStatus,
          },
        },
      });

      const sentInvoice: StoreInvoiceDraft = {
        ...saved,
        status: "sent",
        sentAt: new Date().toISOString(),
      };
      const updated = await saveLeadershipStoreInvoice({ data: sentInvoice });
      setInvoice(updated);
      setNotice(
        `Invoice sent successfully from ${sent.from} to ${saved.customerEmail}${sent.id ? ` · Resend ID ${sent.id}` : ""}.`,
      );
      window.dispatchEvent(new Event("store-email-history-updated"));
    } catch (err) {
      setError(err instanceof Error ? `Could not send invoice: ${err.message}` : "Could not send invoice.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">Preparing invoice from order…</div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <PageHero
          kicker="Quartermaster accounts"
          title="Invoice Not Available"
          body="The selected store order could not be used to create an invoice."
          meta="1ST MI DIV · STORE ADMIN"
        />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          {error ? <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
          <Button asChild variant="secondary"><Link to="/leadership-store/orders">Store Orders</Link></Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster accounts"
        title="Invoice Builder"
        body={`Prefilled from ${invoice.orderNumber}. Review or edit the invoice, then save, print or send it to the customer.`}
        meta="1ST MI DIV · SECURE INVOICE"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <a href={`/leadership-order?id=${encodeURIComponent(invoice.orderId)}`}>
              <ArrowLeft className="h-4 w-4" /> Back to Order
            </a>
          </Button>
          <Button asChild variant="secondary"><Link to="/leadership-store/email"><Mail className="h-4 w-4" /> Email Hub</Link></Button>
          <Button type="button" disabled={saving || sending} onClick={() => void saveDraft()}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Draft"}
          </Button>
          <Button type="button" variant="secondary" disabled={saving || sending} onClick={() => void previewInvoice()}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button type="button" variant="secondary" disabled={saving || sending} onClick={() => void printInvoice()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
          <Button type="button" disabled={sending || saving} onClick={() => void sendInvoice()}>
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send Invoice"}
          </Button>
        </div>

        {error ? <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        {notice ? (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-2xl font-semibold uppercase text-fg">Invoice Details</h2>
                  <p className="mt-1 text-xs text-muted">The original order has already filled these fields for you.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">{fieldLabel("Invoice number")}<input className={inputClass} value={invoice.invoiceNumber} onChange={(e) => patch({ invoiceNumber: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Invoice status")}<select className={inputClass} value={invoice.status} onChange={(e) => patch({ status: e.target.value as StoreInvoiceStatus })}><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select></label>
                <label className="grid gap-2">{fieldLabel("Issue date")}<input className={inputClass} type="date" value={invoice.issueDate} onChange={(e) => patch({ issueDate: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Due date")}<input className={inputClass} type="date" value={invoice.dueDate} onChange={(e) => patch({ dueDate: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Customer name")}<input className={inputClass} value={invoice.customerName} onChange={(e) => patch({ customerName: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Customer email")}<input className={inputClass} type="email" value={invoice.customerEmail} onChange={(e) => patch({ customerEmail: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Discord name")}<input className={inputClass} value={invoice.discordName} onChange={(e) => patch({ discordName: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Currency")}<input className={inputClass} value={invoice.currency} onChange={(e) => patch({ currency: e.target.value.toUpperCase() })} /></label>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <h2 className="font-display text-2xl font-semibold uppercase text-fg">Billing / Shipping Address</h2>
              <p className="mt-1 text-xs text-muted">Prefilled from the order shipping details. You can change it for this invoice without changing the order.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 sm:col-span-2">{fieldLabel("Street address")}<input className={inputClass} value={invoice.billingAddress.address} onChange={(e) => patchAddress("address", e.target.value)} /></label>
                <label className="grid gap-2">{fieldLabel("City")}<input className={inputClass} value={invoice.billingAddress.city} onChange={(e) => patchAddress("city", e.target.value)} /></label>
                <label className="grid gap-2">{fieldLabel("State / region")}<input className={inputClass} value={invoice.billingAddress.state} onChange={(e) => patchAddress("state", e.target.value)} /></label>
                <label className="grid gap-2">{fieldLabel("Postcode")}<input className={inputClass} value={invoice.billingAddress.postalCode} onChange={(e) => patchAddress("postalCode", e.target.value)} /></label>
                <label className="grid gap-2">{fieldLabel("Country")}<input className={inputClass} value={invoice.billingAddress.country} onChange={(e) => patchAddress("country", e.target.value)} /></label>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold uppercase text-fg">Invoice Items</h2>
                  <p className="mt-1 text-xs text-muted">Products, quantities and prices are copied from the order.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addLine}><Plus className="h-4 w-4" /> Add Item</Button>
              </div>

              <div className="mt-5 space-y-3">
                {invoice.lines.map((line, index) => (
                  <div key={line.id} className="grid gap-3 rounded-lg border border-border bg-black/25 p-4 lg:grid-cols-[minmax(0,1fr)_7rem_9rem_auto] lg:items-end">
                    <label className="grid gap-2">{fieldLabel("Description")}<input className={inputClass} value={line.description} onChange={(e) => patchLine(index, "description", e.target.value)} /></label>
                    <label className="grid gap-2">{fieldLabel("Quantity")}<input className={inputClass} type="number" min="1" step="1" value={line.quantity} onChange={(e) => patchLine(index, "quantity", e.target.value)} /></label>
                    <label className="grid gap-2">{fieldLabel("Unit price")}<input className={inputClass} type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => patchLine(index, "unitPrice", e.target.value)} /></label>
                    <Button type="button" variant="secondary" size="icon" disabled={invoice.lines.length <= 1} onClick={() => removeLine(index)} aria-label="Remove invoice item"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">{fieldLabel("Shipping method")}<input className={inputClass} value={invoice.shippingMethod} onChange={(e) => patch({ shippingMethod: e.target.value })} /></label>
                <label className="grid gap-2">{fieldLabel("Shipping amount")}<input className={inputClass} type="number" min="0" step="0.01" value={invoice.shippingAmount} onChange={(e) => patch({ shippingAmount: Math.max(0, Number(e.target.value) || 0) })} /></label>
                <label className="grid gap-2">{fieldLabel("Discount")}<input className={inputClass} type="number" min="0" step="0.01" value={invoice.discountAmount} onChange={(e) => patch({ discountAmount: Math.max(0, Number(e.target.value) || 0) })} /></label>
              </div>
              <label className="mt-4 grid gap-2">{fieldLabel("Payment instructions")}<textarea rows={4} className={textareaClass} value={invoice.paymentInstructions} onChange={(e) => patch({ paymentInstructions: e.target.value })} /></label>
              <label className="mt-4 grid gap-2">{fieldLabel("Notes")}<textarea rows={4} className={textareaClass} value={invoice.notes} onChange={(e) => patch({ notes: e.target.value })} /></label>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <section className="panel panel-feature p-5">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Invoice summary</p>
              <h2 className="mt-2 font-display text-xl font-semibold uppercase text-fg">{invoice.invoiceNumber}</h2>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Order" value={invoice.orderNumber} />
                <SummaryRow label="Customer" value={invoice.customerName} />
                <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal, invoice.currency)} />
                <SummaryRow label={invoice.shippingMethod || "Shipping"} value={formatMoney(totals.shipping, invoice.currency)} />
                {totals.discount > 0 ? <SummaryRow label="Discount" value={`-${formatMoney(totals.discount, invoice.currency)}`} /> : null}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-display text-lg uppercase text-fg">Total</span>
                  <span className="font-display text-2xl font-semibold text-primary">{formatMoney(totals.total, invoice.currency)}</span>
                </div>
              </div>
            </section>

            <section className="panel panel-static p-5">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Delivery</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">Send Invoice emails the completed invoice to <strong className="text-fg">{invoice.customerEmail}</strong> and records it in the Store Email Hub.</p>
              <p className="mt-3 text-xs leading-relaxed text-muted">Print / Save PDF opens the browser print dialog, where you can choose <strong className="text-fg">Save as PDF</strong>.</p>
              <p className="mt-3 text-xs leading-relaxed text-muted">Invoices are labelled <strong className="text-fg">Invoice</strong>, not Tax Invoice.</p>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted">{label}</span><span className="text-right font-semibold text-fg">{value}</span></div>;
}
