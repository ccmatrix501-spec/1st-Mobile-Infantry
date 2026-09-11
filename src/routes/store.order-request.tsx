import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Send,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreCurrencyNote, StoreMoney } from "@/components/store-price";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import { useStoreCart } from "@/lib/store-cart";
import {
  submitStoreOrderRequest,
  type StoreOrderRequestInput,
} from "@/lib/store-order-request-fn";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";
import { productPrice, shippingOptionPrice } from "@/lib/store-utils";

export const Route = createFileRoute("/store/order-request")({
  component: StoreOrderRequestPage,
  head: () => ({ meta: [{ title: "Place Order — 1st M.I. Store" }] }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/55 px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-primary/70 focus:bg-black/65";

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discordName: string;
  preferredContact: "discord" | "email" | "phone";
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  companyWebsite: string;
};

function StoreOrderRequestPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState<"standard" | "express">("standard");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{
    orderNumber: string;
    total: number;
    currency: string;
    preferredContact: string;
  } | null>(null);
  const [fields, setFields] = useState<FormFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    discordName: "",
    preferredContact: "discord",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
    companyWebsite: "",
  });
  const cart = useStoreCart();

  useEffect(() => {
    let cancelled = false;
    void fetchStorePageAccess()
      .then((value) => {
        if (cancelled) return;
        setAccess(value);
        const first = value.settings.shippingOptions.find(
          (option) => option.enabled && option.rate.trim(),
        );
        if (first?.id === "standard" || first?.id === "express") {
          setShippingOptionId(first.id);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!access?.visible) return [];
    return cart.lines.flatMap((line) => {
      const product = access.settings.products.find((item) => item.id === line.productId);
      if (!product || product.status !== "published") return [];
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId && item.active) ?? null
        : null;
      if (line.variantId && !variant) return [];
      const unitPrice = productPrice(product, variant);
      return [{
        line,
        product,
        variant,
        unitPrice,
        lineTotal: unitPrice * line.quantity,
      }];
    });
  }, [access, cart.lines]);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingOptions = access?.settings.shippingOptions.filter(
    (option) => option.enabled && option.rate.trim(),
  ) ?? [];
  const shippingOption = shippingOptions.find((option) => option.id === shippingOptionId) ?? null;
  const shipping = shippingOptionPrice(shippingOption);
  const currency = resolved[0]?.product.currency || access?.settings.defaultCurrency || "AUD";
  const total = subtotal + shipping;

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submitOrder() {
    setError(null);
    if (!shippingOption) {
      setError("Choose Standard or Express shipping before submitting your order.");
      return;
    }
    if (!resolved.length) {
      setError("Your cart does not contain any available products.");
      return;
    }
    if (!fields.firstName.trim() || !fields.lastName.trim() || !fields.email.trim()) {
      setError("Enter your first name, last name and email address.");
      return;
    }
    if (!fields.address.trim() || !fields.city.trim() || !fields.country.trim()) {
      setError("Enter your delivery address, city/suburb and country.");
      return;
    }
    if (fields.preferredContact === "discord" && !fields.discordName.trim()) {
      setError("Enter your Discord name or choose a different preferred contact method.");
      return;
    }
    if (fields.preferredContact === "phone" && !fields.phone.trim()) {
      setError("Enter your phone number or choose a different preferred contact method.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: StoreOrderRequestInput = {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        phone: fields.phone || undefined,
        discordName: fields.discordName || undefined,
        preferredContact: fields.preferredContact,
        address: fields.address,
        city: fields.city,
        state: fields.state || undefined,
        postalCode: fields.postalCode || undefined,
        country: fields.country,
        shippingOptionId,
        lines: cart.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId || undefined,
          quantity: line.quantity,
        })),
        companyWebsite: fields.companyWebsite,
      };
      const result = await submitStoreOrderRequest({ data: payload });
      setSubmitted({
        orderNumber: result.orderNumber,
        total: result.total,
        currency: result.currency,
        preferredContact: result.preferredContact,
      });
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your order request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">
          Loading order page…
        </div>
      </AppShell>
    );
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero kicker="404" title="Order Page Not Available" body="The Store is not currently available." meta="1ST MI DIV · QUARTERMASTER" />
      </AppShell>
    );
  }

  if (submitted) {
    const contactText =
      submitted.preferredContact === "discord"
        ? "Discord"
        : submitted.preferredContact === "phone"
          ? "phone"
          : "email";
    return (
      <AppShell>
        <StoreToolbar />
        <PageHero kicker="Quartermaster" title="Order Request Received" body="Your order has been sent to Website Staff." meta="1ST MI DIV · ORDER RECEIVED" />
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="panel panel-feature p-6 text-center sm:p-9">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-5 stencil text-[10px] tracking-[0.14em] text-primary">Order number</p>
            <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">{submitted.orderNumber}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
              No payment was taken on the website. Website Staff have received your order and will contact you by {contactText} with payment details and anything else needed before the order is approved for processing.
            </p>
            <div className="mx-auto mt-5 max-w-sm rounded-lg border border-border bg-black/30 p-4">
              <p className="text-xs text-muted">Order total before any staff adjustments</p>
              <p className="mt-1 font-display text-3xl font-semibold text-primary">
                <StoreMoney amount={submitted.total} currency={submitted.currency} />
              </p>
            </div>
            <p className="mt-4 text-xs text-muted">Keep your order number in case staff ask for it.</p>
            <Button asChild className="mt-6"><Link to="/store">Return to Store</Link></Button>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!resolved.length) {
    return (
      <AppShell>
        <StoreToolbar />
        <PageHero kicker="Quartermaster" title="Place Order" body="Your cart is empty." meta="1ST MI DIV · ORDER REQUEST" />
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <ShoppingCart className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-sm text-muted">Add products to your cart before submitting an order.</p>
          <Button asChild className="mt-6"><Link to="/store">Browse Store</Link></Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StoreToolbar />
      <PageHero
        kicker="Quartermaster"
        title="Place Order"
        body="Send your order to Website Staff. Staff will contact you with payment details before the order is processed."
        meta="1ST MI DIV · STAFF-ASSISTED CHECKOUT"
      />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {error ? (
          <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div>
        ) : null}

        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-5">
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">Staff-assisted payment</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                This page does not take a payment. Submitting creates a real order for Website Staff and sends it to the Discord Store Orders Forum. Staff will contact you with payment details and can confirm or adjust the order with you before processing it.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-5">
            <section className="rounded-xl border border-border bg-black/65 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Contact Details</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="First name"><input className={inputClass} autoComplete="given-name" value={fields.firstName} onChange={(e) => setField("firstName", e.target.value)} /></Field>
                <Field label="Last name"><input className={inputClass} autoComplete="family-name" value={fields.lastName} onChange={(e) => setField("lastName", e.target.value)} /></Field>
                <Field label="Email"><input type="email" className={inputClass} autoComplete="email" value={fields.email} onChange={(e) => setField("email", e.target.value)} /></Field>
                <Field label="Phone (optional)"><input className={inputClass} autoComplete="tel" value={fields.phone} onChange={(e) => setField("phone", e.target.value)} /></Field>
                <Field label="Discord name (optional)"><input className={inputClass} placeholder="e.g. Matrix501 or @Matrix501" value={fields.discordName} onChange={(e) => setField("discordName", e.target.value)} /></Field>
                <Field label="Preferred contact">
                  <select className={inputClass} value={fields.preferredContact} onChange={(e) => setField("preferredContact", e.target.value as FormFields["preferredContact"])}>
                    <option value="discord">Discord</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>
                </Field>
              </div>
              <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={fields.companyWebsite} onChange={(e) => setField("companyWebsite", e.target.value)} />
            </section>

            <section className="rounded-xl border border-border bg-black/65 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Details</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Address"><input className={inputClass} autoComplete="street-address" value={fields.address} onChange={(e) => setField("address", e.target.value)} /></Field></div>
                <Field label="City / suburb"><input className={inputClass} autoComplete="address-level2" value={fields.city} onChange={(e) => setField("city", e.target.value)} /></Field>
                <Field label="State / province"><input className={inputClass} autoComplete="address-level1" value={fields.state} onChange={(e) => setField("state", e.target.value)} /></Field>
                <Field label="Postal / ZIP code"><input className={inputClass} autoComplete="postal-code" value={fields.postalCode} onChange={(e) => setField("postalCode", e.target.value)} /></Field>
                <Field label="Country / region"><input className={inputClass} autoComplete="country-name" value={fields.country} onChange={(e) => setField("country", e.target.value)} /></Field>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-black/65 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Method</h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {shippingOptions.map((option) => (
                  <label key={option.id} className={`cursor-pointer rounded-xl border p-4 ${shippingOptionId === option.id ? "border-primary bg-primary/10" : "border-border bg-black/25"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input type="radio" name="order-shipping" className="mt-1 accent-[var(--color-primary)]" checked={shippingOptionId === option.id} onChange={() => setShippingOptionId(option.id)} />
                        <div><p className="font-display text-lg font-semibold uppercase text-fg">{option.name}</p><p className="mt-1 text-xs text-muted">{option.description}</p></div>
                      </div>
                      <span className="font-semibold text-primary"><StoreMoney amount={shippingOptionPrice(option)} currency={currency} /></span>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-xl border border-primary/30 bg-black/75 p-5 sm:p-6 xl:sticky xl:top-24">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Summary</h2>
            </div>
            <div className="mt-3"><StoreCurrencyNote baseCurrency={currency} /></div>

            <div className="mt-5 space-y-3 rounded-lg border border-border bg-black/35 p-4">
              {resolved.map(({ line, product, variant, lineTotal }) => (
                <div key={`${line.productId}:${line.variantId}`} className="flex justify-between gap-4 border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                  <div><p className="text-fg">{product.name} × {line.quantity}</p>{variant ? <p className="mt-1 text-xs text-muted">{variant.name}</p> : null}</div>
                  <span className="shrink-0 text-fg"><StoreMoney amount={lineTotal} currency={product.currency} /></span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Subtotal" value={<StoreMoney amount={subtotal} currency={currency} />} />
              <SummaryRow label="Shipping" value={shippingOption ? <StoreMoney amount={shipping} currency={currency} /> : "Select method"} />
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-display text-lg font-semibold uppercase text-fg">Total</span>
                <span className="font-display text-3xl font-semibold text-primary"><StoreMoney amount={total} currency={currency} /></span>
              </div>
            </div>

            <Button type="button" size="lg" className="mt-6 w-full" disabled={submitting || !shippingOption} onClick={() => void submitOrder()}>
              <Send className="h-4 w-4" />{submitting ? "Sending Order…" : "Send Order to Website Staff"}
            </Button>
            <p className="mt-3 text-center text-xs leading-relaxed text-muted">No payment is taken when you submit. Staff will contact you with payment details.</p>
            <Button asChild variant="secondary" className="mt-3 w-full"><Link to="/store/cart"><ArrowLeft className="h-4 w-4" />Return to Cart</Link></Button>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block stencil text-[9px] tracking-[0.12em] text-primary">{label}</span>{children}</label>;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-muted">{label}</span><span className="text-right text-fg">{value}</span></div>;
}
