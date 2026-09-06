import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  EyeOff,
  Minus,
  PackageOpen,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
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
  productPrimaryImage,
  shippingForSubtotal,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/cart")({
  component: StoreCartPage,
  head: () => ({ meta: [{ title: "Cart — 1st M.I. Store" }] }),
});

function StoreCartPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [shippingZoneId, setShippingZoneId] = useState("");
  const cart = useStoreCart();

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

  const resolved = useMemo(() => {
    if (!access?.visible) return [];
    return cart.lines.flatMap((line) => {
      const product = access.settings.products.find((item) => item.id === line.productId);
      if (!product) return [];
      if (!access.leadershipPreview && product.status !== "published") return [];
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId) ?? null
        : null;
      const unitPrice = productPrice(product, variant);
      return [{ line, product, variant, unitPrice, lineTotal: unitPrice * line.quantity }];
    });
  }, [access, cart.lines]);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingZones = access?.settings.shippingZones.filter((zone) => zone.enabled) ?? [];
  const shippingZone = shippingZones.find((zone) => zone.id === shippingZoneId) ?? null;
  const shipping = shippingForSubtotal(shippingZone, subtotal);
  const total = subtotal + shipping;
  const currency = resolved[0]?.product.currency || access?.settings.defaultCurrency || "AUD";

  if (!access && !failed) {
    return <AppShell><div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">Loading cart…</div></AppShell>;
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero kicker="404" title="Page Not Available" body="The Store is not currently available." meta="1ST MI DIV · PUBLIC SITE" />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <EyeOff className="mx-auto h-8 w-8 text-muted" />
          <Button asChild variant="secondary" className="mt-6"><Link to="/"><ArrowLeft className="h-4 w-4" />Back to Home</Link></Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {access.leadershipPreview ? (
        <div className="border-b border-amber-300/25 bg-amber-300/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="flex items-center gap-2 text-sm text-amber-100"><ShieldCheck className="h-4 w-4" />Leadership Store preview</p>
            <Link to="/leadership-store" className="stencil text-[10px] tracking-[0.12em] text-amber-100">Store Manager</Link>
          </div>
        </div>
      ) : null}
      <StoreToolbar />
      <PageHero kicker="Quartermaster" title="Your Cart" body="Review your selected 1st M.I. merchandise and estimate shipping before checkout." meta="1ST MI DIV · SUPPLY CART" />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {!resolved.length ? (
          <div className="panel panel-static px-6 py-14 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">Browse the Quartermaster catalogue and add some gear.</p>
            <Button asChild className="mt-6"><Link to="/store">Browse Store</Link></Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-4">
              {resolved.map(({ line, product, variant, unitPrice, lineTotal }) => {
                const image = productPrimaryImage(product);
                return (
                  <article key={`${line.productId}:${line.variantId}`} className="panel panel-static p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
                      <a href={`/store/${encodeURIComponent(product.slug)}`} className="aspect-square overflow-hidden rounded-md border border-border bg-black/45">
                        {image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><PackageOpen className="h-7 w-7 text-muted" /></div>}
                      </a>
                      <div className="min-w-0">
                        <p className="stencil text-[9px] tracking-[0.14em] text-primary">{product.category}</p>
                        <a href={`/store/${encodeURIComponent(product.slug)}`} className="hover:text-primary">
                          <h2 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg">{product.name}</h2>
                        </a>
                        {variant ? <p className="mt-1 text-xs text-muted">{variant.name}{variant.options.length ? ` · ${variant.options.map((option) => option.value).join(" / ")}` : ""}</p> : null}
                        <p className="mt-2 font-mono text-xs text-muted"><StoreMoney amount={unitPrice} currency={product.currency} /> each</p>
                      </div>
                      <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <p className="font-display text-xl font-semibold text-primary"><StoreMoney amount={lineTotal} currency={product.currency} /></p>
                        <div className="flex items-center rounded-md border border-border-strong bg-black/45">
                          <button type="button" onClick={() => cart.setQuantity(line.productId, line.variantId, Math.max(1, line.quantity - 1))} className="p-2 text-muted hover:text-fg"><Minus className="h-4 w-4" /></button>
                          <span className="min-w-9 text-center font-mono text-xs text-fg">{line.quantity}</span>
                          <button type="button" onClick={() => cart.setQuantity(line.productId, line.variantId, line.quantity + 1)} className="p-2 text-muted hover:text-fg"><Plus className="h-4 w-4" /></button>
                        </div>
                        <button type="button" onClick={() => cart.remove(line.productId, line.variantId)} className="inline-flex items-center gap-1 text-xs text-red-200 hover:text-red-100"><Trash2 className="h-3.5 w-3.5" />Remove</button>
                      </div>
                    </div>
                  </article>
                );
              })}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="secondary"><Link to="/store"><ArrowLeft className="h-4 w-4" />Continue Shopping</Link></Button>
                <button type="button" onClick={() => cart.clear()} className="text-xs text-muted hover:text-red-200">Clear cart</button>
              </div>
            </div>

            <aside className="panel panel-feature h-fit p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Summary</h2>
              </div>
              <div className="mt-2"><StoreCurrencyNote baseCurrency={currency} /></div>

              <div className="mt-5 space-y-3 border-b border-border pb-5 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted">Subtotal</span><span className="text-fg"><StoreMoney amount={subtotal} currency={currency} /></span></div>
                <div className="flex justify-between gap-4"><span className="text-muted">Shipping</span><span className="text-fg">{shippingZone ? (shipping ? <StoreMoney amount={shipping} currency={currency} /> : "Free") : "Select zone"}</span></div>
              </div>

              <div className="mt-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 stencil text-[9px] tracking-[0.12em] text-primary"><Truck className="h-3.5 w-3.5" />Shipping zone</span>
                  <select value={shippingZoneId} onChange={(event) => setShippingZoneId(event.target.value)} className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none focus:border-primary/70">
                    <option value="">Select destination region</option>
                    {shippingZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                  </select>
                </label>
                {!shippingZones.length ? <p className="mt-2 text-xs leading-relaxed text-muted">Leadership has not configured shipping zones yet.</p> : null}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                <span className="font-display text-lg font-semibold uppercase text-fg">Estimated Total</span>
                <span className="font-display text-2xl font-semibold text-primary"><StoreMoney amount={total} currency={currency} /></span>
              </div>

              <Button asChild size="lg" className="mt-6 w-full">
                <Link to="/store/checkout">Continue to Checkout</Link>
              </Button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted">{access.settings.cartNotice}</p>
            </aside>
          </div>
        )}
      </section>
    </AppShell>
  );
}
