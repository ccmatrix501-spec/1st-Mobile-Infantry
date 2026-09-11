import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  PackageOpen,
  Send,
  ShieldCheck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import {
  submitCustom3dPrintRequest,
  type Custom3dPrintRequestInput,
} from "@/lib/store-custom-3d-request-fn";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";

export const Route = createFileRoute("/store/custom-3d-print")({
  component: Custom3dPrintPage,
  head: () => ({
    meta: [{ title: "Custom 3D Print Request — 1st M.I. Store" }],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/55 px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-primary/70 focus:bg-black/65";
const textareaClass =
  "min-h-36 w-full rounded-md border border-border-strong bg-black/55 px-3 py-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-primary/70 focus:bg-black/65";

const INITIAL_FORM: Custom3dPrintRequestInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  discordName: "",
  preferredContact: "discord",
  projectName: "",
  description: "",
  quantity: 1,
  dimensions: "",
  coloursMaterial: "",
  budget: "",
  neededBy: "",
  referenceLink: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Australia",
  companyWebsite: "",
};

function Custom3dPrintPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState<Custom3dPrintRequestInput>({ ...INITIAL_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchStorePageAccess()
      .then((value) => {
        if (!cancelled) setAccess(value);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof Custom3dPrintRequestInput>(
    key: K,
    value: Custom3dPrintRequestInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setOrderNumber(null);
    try {
      const result = await submitCustom3dPrintRequest({ data: form });
      setOrderNumber(result.orderNumber);
      setNotificationSent(result.notificationSent);
      setForm({ ...INITIAL_FORM });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your custom print request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">
          Loading custom print requests…
        </div>
      </AppShell>
    );
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero
          kicker="Quartermaster"
          title="Custom Requests Closed"
          body="Custom 3D print requests are not currently available."
          meta="1ST MI DIV · QUARTERMASTER"
        />
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <Button asChild variant="secondary">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Home</Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {access.leadershipPreview ? (
        <div className="border-b border-amber-300/25 bg-amber-300/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="flex items-center gap-2 text-sm text-amber-100">
              <ShieldCheck className="h-4 w-4" /> Leadership Store preview
            </p>
            <Link to="/leadership-store" className="stencil text-[10px] tracking-[0.12em] text-amber-100">
              Store Manager
            </Link>
          </div>
        </div>
      ) : null}

      <StoreToolbar />
      <PageHero
        kicker="Custom fabrication"
        title="Custom 3D Print Request"
        body="Tell us what you want made. No payment is taken now — the store team will review your request, contact you, discuss the design and provide a price before anything is printed."
        meta="1ST MI DIV · REQUEST A QUOTE"
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6">
          <Button asChild variant="secondary">
            <Link to="/store"><ArrowLeft className="h-4 w-4" /> Back to Store</Link>
          </Button>
        </div>

        {orderNumber ? (
          <div className="mb-8 rounded-xl border border-primary/35 bg-primary/10 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-primary" />
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Request received</p>
                <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
                  {orderNumber}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  Your custom 3D print request has been saved. Staff will review what you want, contact you using your preferred contact method and discuss the price before any payment or printing takes place.
                </p>
                <p className="mt-3 text-xs text-muted">
                  {notificationSent
                    ? "The store team has also been notified in Discord."
                    : "The request is saved in the staff order system even if the Discord alert is still pending."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <form onSubmit={submit} className="panel panel-feature p-5 sm:p-7">
            <div>
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">1 · Contact details</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">How should staff reach you?</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="First name *"><input className={inputClass} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} required /></Field>
              <Field label="Last name *"><input className={inputClass} value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} required /></Field>
              <Field label="Email *"><input className={inputClass} type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required /></Field>
              <Field label="Phone (optional)"><input className={inputClass} value={form.phone || ""} onChange={(e) => setField("phone", e.target.value)} /></Field>
              <Field label="Discord name (optional)"><input className={inputClass} value={form.discordName || ""} onChange={(e) => setField("discordName", e.target.value)} placeholder="e.g. Matrix501 or @Matrix501" /></Field>
              <Field label="Preferred contact">
                <select className={inputClass} value={form.preferredContact} onChange={(e) => setField("preferredContact", e.target.value as Custom3dPrintRequestInput["preferredContact"])}>
                  <option value="discord">Discord</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </Field>
            </div>

            <div className="mt-8 border-t border-border pt-7">
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">2 · Print request</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">What do you want made?</h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Project name (optional)"><input className={inputClass} value={form.projectName || ""} onChange={(e) => setField("projectName", e.target.value)} placeholder="e.g. Custom unit badge" /></Field>
              <Field label="Quantity"><input className={inputClass} type="number" min="1" max="99" value={form.quantity} onChange={(e) => setField("quantity", Number(e.target.value) || 1)} /></Field>
              <div className="sm:col-span-2">
                <Field label="Describe what you want printed *">
                  <textarea className={textareaClass} maxLength={1200} value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the item, shape, text, logos, moving parts, mounting method, intended use, or anything else staff should know." required />
                </Field>
                <p className="mt-1 text-right font-mono text-[10px] text-subtle">{form.description.length}/1200</p>
              </div>
              <Field label="Approx. size / dimensions"><input className={inputClass} value={form.dimensions || ""} onChange={(e) => setField("dimensions", e.target.value)} placeholder="e.g. 150 × 80 × 20 mm" /></Field>
              <Field label="Colours / material / finish"><input className={inputClass} value={form.coloursMaterial || ""} onChange={(e) => setField("coloursMaterial", e.target.value)} placeholder="e.g. black PLA with white lettering" /></Field>
              <Field label="Budget (optional)"><input className={inputClass} value={form.budget || ""} onChange={(e) => setField("budget", e.target.value)} placeholder="e.g. Around $40 AUD" /></Field>
              <Field label="Needed by (optional)"><input className={inputClass} value={form.neededBy || ""} onChange={(e) => setField("neededBy", e.target.value)} placeholder="e.g. Before 20 October" /></Field>
              <div className="sm:col-span-2">
                <Field label="Reference image/model link (optional)"><input className={inputClass} type="url" value={form.referenceLink || ""} onChange={(e) => setField("referenceLink", e.target.value)} placeholder="https://..." /></Field>
                <p className="mt-1 text-xs text-muted">You can link to a reference image, 3D model, Google Drive file or other HTTPS page.</p>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-7">
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">3 · General location</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">Where would it be going?</h2>
              <p className="mt-2 text-sm text-muted">A full street address is not needed until you accept a quote. This just helps staff estimate shipping.</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="City / suburb *"><input className={inputClass} value={form.city} onChange={(e) => setField("city", e.target.value)} required /></Field>
              <Field label="State / region"><input className={inputClass} value={form.state || ""} onChange={(e) => setField("state", e.target.value)} /></Field>
              <Field label="Postcode"><input className={inputClass} value={form.postalCode || ""} onChange={(e) => setField("postalCode", e.target.value)} /></Field>
              <Field label="Country *"><input className={inputClass} value={form.country} onChange={(e) => setField("country", e.target.value)} required /></Field>
            </div>

            <div className="hidden" aria-hidden="true">
              <label>Company website<input tabIndex={-1} autoComplete="off" value={form.companyWebsite || ""} onChange={(e) => setField("companyWebsite", e.target.value)} /></label>
            </div>

            <div className="mt-8 rounded-lg border border-primary/25 bg-primary/5 p-4">
              <p className="text-sm leading-relaxed text-muted">
                Submitting this form creates a <strong className="text-fg">quote request only</strong>. No payment is taken and no print is started until staff contacts you and you agree on the design and price.
              </p>
            </div>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
              <Send className="h-4 w-4" /> {submitting ? "Submitting request…" : "Submit Custom Print Request"}
            </Button>
          </form>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <div className="panel panel-static p-5">
              <PackageOpen className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">How it works</h3>
              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <li><strong className="text-fg">1.</strong> Send the request.</li>
                <li><strong className="text-fg">2.</strong> Website Staff gets the order notification.</li>
                <li><strong className="text-fg">3.</strong> Staff contacts you to discuss the design.</li>
                <li><strong className="text-fg">4.</strong> You receive a price before printing starts.</li>
              </ol>
            </div>

            <div className="panel panel-static p-5">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">Discord is easiest</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">If you provide your Discord name, the order Forum post uses it so staff can identify you quickly.</p>
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block stencil text-[9px] tracking-[0.12em] text-primary">{label}</span>
      {children}
    </label>
  );
}
