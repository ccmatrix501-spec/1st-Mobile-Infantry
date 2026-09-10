import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CreditCard,
  LockKeyhole,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreCurrencyNote, StoreMoney } from "@/components/store-price";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import { useStoreCart } from "@/lib/store-cart";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";
import {
  productPrice,
  shippingOptionPrice,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/checkout")({
  component: StoreCheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — 1st M.I. Store" }] }),
});

const inputClass = "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none focus:border-primary/70";

function StoreCheckoutPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const cart = useStoreCart();

  useEffect(() => {
    let cancelled = false;
    void fetchStorePageAccess()
      .then((value) => {
        if (!cancelled) {
          setAccess(value);
          const firstEnabled = value.settings.shippingOptions.find((option) => option.enabled);
          if (firstEnabled) setShippingOptionId((current) => current || firstEnabled.id);
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
      if (!product) return [];
      if (!access.leadershipPreview && product.status !== "published") return [];
      const variant = line.variantId ? product.variants.find((item) => item.id === line.variantId) ?? null : null;
      const unitPrice = productPrice(product, variant);
      return [{ line, product, variant, unitPrice, lineTotal: unitPrice * line.quantity }];
    });
  }, [access, cart.lines]);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingOptions = access?.settings.shippingOptions.filter((option) => option.enabled) ?? [];
  const shippingOption = shippingOptions.find((option) => option.id === shippingOptionId) ?? null;
  const shippingConfigured = Boolean(shippingOption?.rate.trim());
  const shipping = shippingOptionPrice(shippingOption);
  const currency = resolved[0]?.product.currency || access?.settings.defaultCurrency || "AUD";
  const total = subtotal + shipping;

  if (!access && !failed) {
    return <AppShell><div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">Loading checkout…</div></AppShell>;
  }

  if (failed || !access?.visible) {
    return <AppShell><PageHero kicker="404" title="Checkout Not Available" body="The Store is not currently available." meta="1ST MI DIV · PUBLIC SITE" /></AppShell>;
  }

  if (!resolved.length) {
    return (
      <AppShell>
        <StoreToolbar />
        <PageHero kicker="Quartermaster" title="Checkout" body="Your supply cart is empty." meta="1ST MI DIV · CHECKOUT" />
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <ShoppingCart className="mx-auto h-10 w-10 text-primary" />
          <Button asChild className="mt-6"><Link to="/store">Browse Store</Link></Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {access.leadershipPreview ? (
        <div className="border-b border-amber-300/25 bg-amber-300/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="flex items-center gap-2 text-sm text-amber-100"><ShieldCheck className="h-4 w-4" />Leadership checkout preview</p>
            <Link to="/leadership-store" className="stencil text-[10px] tracking-[0.12em] text-amber-100">Store Manager</Link>
          </div>
        </div>
      ) : null}
      <StoreToolbar />
      <PageHero kicker="Quartermaster" title="Checkout" body="Enter the delivery destination, then choose Standard or Express worldwide shipping." meta="1ST MI DIV · CHECKOUT" />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-50">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide">Payments are intentionally disabled</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/80">{access.settings.checkoutNotice} Nothing entered on this page is submitted or stored.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Contact Details</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="First name"><input className={inputClass} autoComplete="given-name" /></Field>
                <Field label="Last name"><input className={inputClass} autoComplete="family-name" /></Field>
                <Field label="Email"><input type="email" className={inputClass} autoComplete="email" /></Field>
                <Field label="Phone"><input className={inputClass} autoComplete="tel" /></Field>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Address</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">Worldwide delivery destination is entered here at checkout. Shipping is not linked to product stock.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Address"><input className={inputClass} autoComplete="street-address" /></Field></div>
                <Field label="City / suburb"><input className={inputClass} autoComplete="address-level2" /></Field>
                <Field label="State / province"><input className={inputClass} autoComplete="address-level1" /></Field>
                <Field label="Postal / ZIP code"><input className={inputClass} autoComplete="postal-code" /></Field>
                <Field label="Country / region"><input className={inputClass} autoComplete="country-name" placeholder="Australia" /></Field>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Method</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">Choose one delivery option. The selected shipping price is added to the order total here at checkout.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {shippingOptions.map((option) => {
                  const selected = option.id === shippingOptionId;
                  return (
                    <label key={option.id} className={`cursor-pointer rounded-lg border p-4 transition-colors ${selected ? "border-primary/70 bg-primary/10" : "border-border-strong bg-black/25 hover:border-primary/40"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <input type="radio" name="shipping-method" value={option.id} checked={selected} onChange={() => setShippingOptionId(option.id)} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
                          <div>
                            <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">{option.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted">{option.description}</p>
                          </div>
                        </div>
                        <span className="shrink-0 font-display text-lg font-semibold text-primary">
                          {option.rate.trim() ? <StoreMoney amount={shippingOptionPrice(option)} currency={currency} /> : "Price pending"}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {!shippingOptions.length ? <p className="mt-4 text-sm text-muted">Leadership has disabled both shipping options.</p> : null}
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Payment</h2>
              </div>
              <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-black/25 px-5 py-10 text-center">
                <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">Payment provider not connected</p>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">When you decide on the payment provider, this section will be replaced with the secure checkout hand-off. Card details will never be stored by 1stmid.com.</p>
              </div>
            </section>
          </div>

          <aside className="panel panel-feature h-fit p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Summary</h2>
            <div className="mt-2"><StoreCurrencyNote baseCurrency={currency} /></div>
            <div className="mt-5 space-y-4">
              {resolved.map(({ line, product, variant, lineTotal }) => (
                <div key={`${line.productId}:${line.variantId}`} className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm">
                  <div>
                    <p className="text-fg">{product.name} × {line.quantity}</p>
                    {variant ? <p className="mt-1 text-xs text-muted">{variant.name}</p> : null}
                  </div>
                  <p className="shrink-0 text-fg"><StoreMoney amount={lineTotal} currency={product.currency} /></p>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span className="text-fg"><StoreMoney amount={subtotal} currency={currency} /></span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span className="text-fg">{shippingOption ? (shippingConfigured ? <StoreMoney amount={shipping} currency={currency} /> : "Price pending") : "Select method"}</span></div>
              <div className="flex justify-between border-t border-border pt-4 font-display text-xl font-semibold uppercase"><span className="text-fg">Total</span><span className="text-primary">{shippingOption && shippingConfigured ? <StoreMoney amount={total} currency={currency} /> : "Pending"}</span></div>
            </div>

            <Button type="button" size="lg" className="mt-6 w-full" disabled>
              <LockKeyhole className="h-4 w-4" />Payment Not Connected
            </Button>
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
