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
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/cart")({
  component: StoreCartPage,
  head: () => ({ meta: [{ title: "Cart — 1st M.I. Store" }] }),
});

function StoreCartPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
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
      const product = access.settings.products.find(
        (item) => item.id === line.productId,
      );
      if (!product) return [];
      if (!access.leadershipPreview && product.status !== "published") return [];
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId) ?? null
        : null;
      const unitPrice = productPrice(product, variant);
      return [
        {
          line,
          product,
          variant,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        },
      ];
    });
  }, [access, cart.lines]);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = resolved.reduce((sum, item) => sum + item.line.quantity, 0);
  const currency =
    resolved[0]?.product.currency || access?.settings.defaultCurrency || "AUD";

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">
          Loading cart…
        </div>
      </AppShell>
    );
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero
          kicker="404"
          title="Page Not Available"
          body="The Store is not currently available."
          meta="1ST MI DIV · PUBLIC SITE"
        />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <EyeOff className="mx-auto h-8 w-8 text-muted" />
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />Back to Home
            </Link>
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
              <ShieldCheck className="h-4 w-4" />Leadership Store preview
            </p>
            <Link
              to="/leadership-store"
              className="stencil text-[10px] tracking-[0.12em] text-amber-100"
            >
              Store Manager
            </Link>
          </div>
        </div>
      ) : null}
      <StoreToolbar />
      <PageHero
        kicker="Quartermaster"
        title="Your Cart"
        body="Review your selected 1st M.I. merchandise. Shipping destination and Standard or Express delivery are selected at checkout."
        meta="1ST MI DIV · SUPPLY CART"
      />

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-border/80 bg-black/55 p-3 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-md sm:p-5 lg:p-6">
          {!resolved.length ? (
            <div className="panel panel-static bg-black/65 px-6 py-14 text-center backdrop-blur-sm">
              <PackageOpen className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                Your cart is empty
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                Browse the Quartermaster catalogue and add some gear.
              </p>
              <Button asChild className="mt-6">
                <Link to="/store">Browse Store</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 rounded-xl border border-border bg-black/45 p-4 sm:grid-cols-2 sm:items-center sm:p-5">
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                    Supply cart
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                    {itemCount} item{itemCount === 1 ? "" : "s"} ready
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:justify-self-end">
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-fg">Shipping at checkout</p>
                    <p className="mt-0.5 text-xs text-muted">Choose Standard or Express after entering your address.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className="space-y-4">
                  {resolved.map(
                    ({ line, product, variant, unitPrice, lineTotal }) => {
                      const image = productPrimaryImage(product);
                      return (
                        <article
                          key={`${line.productId}:${line.variantId}`}
                          className="rounded-xl border border-border bg-black/65 p-4 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-5"
                        >
                          <div className="grid gap-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] lg:grid-cols-[7.5rem_minmax(0,1fr)_auto] lg:items-center">
                            <Link
                              to="/store/$productId"
                              params={{ productId: product.slug }}
                              className="aspect-square overflow-hidden rounded-lg border border-border-strong bg-black/55"
                            >
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <PackageOpen className="h-7 w-7 text-muted" />
                                </div>
                              )}
                            </Link>

                            <div className="min-w-0">
                              <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                                {product.category}
                              </p>
                              <Link
                                to="/store/$productId"
                                params={{ productId: product.slug }}
                                className="hover:text-primary"
                              >
                                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                                  {product.name}
                                </h2>
                              </Link>
                              {variant ? (
                                <p className="mt-1 text-xs text-muted">
                                  {variant.name}
                                  {variant.options.length
                                    ? ` · ${variant.options.map((option) => option.value).join(" / ")}`
                                    : ""}
                                </p>
                              ) : null}
                              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                                <span>
                                  <StoreMoney amount={unitPrice} currency={product.currency} /> each
                                </span>
                                <span className="rounded-full border border-border bg-black/35 px-2.5 py-1">
                                  {product.stockStatus || "Available"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                              <div className="text-left lg:text-right">
                                <p className="stencil text-[8px] tracking-[0.12em] text-muted">Line total</p>
                                <p className="mt-1 font-display text-2xl font-semibold text-primary">
                                  <StoreMoney amount={lineTotal} currency={product.currency} />
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center rounded-md border border-border-strong bg-black/60">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      cart.setQuantity(
                                        line.productId,
                                        line.variantId,
                                        Math.max(1, line.quantity - 1),
                                      )
                                    }
                                    className="p-2.5 text-muted hover:text-fg"
                                    aria-label={`Decrease ${product.name} quantity`}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="min-w-10 text-center font-mono text-sm text-fg">
                                    {line.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      cart.setQuantity(
                                        line.productId,
                                        line.variantId,
                                        line.quantity + 1,
                                      )
                                    }
                                    className="p-2.5 text-muted hover:text-fg"
                                    aria-label={`Increase ${product.name} quantity`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => cart.remove(line.productId, line.variantId)}
                                  className="inline-flex h-10 items-center gap-1.5 rounded-md border border-red-400/20 bg-red-500/10 px-3 text-xs text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    },
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <Button asChild variant="secondary">
                      <Link to="/store">
                        <ArrowLeft className="h-4 w-4" />Continue Shopping
                      </Link>
                    </Button>
                    <button
                      type="button"
                      onClick={() => cart.clear()}
                      className="rounded-md px-3 py-2 text-xs text-muted transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                      Clear cart
                    </button>
                  </div>
                </div>

                <aside className="h-fit rounded-xl border border-primary/30 bg-black/75 p-5 shadow-[0_18px_55px_rgba(0,0,0,.35)] backdrop-blur-md sm:p-6 xl:sticky xl:top-24">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                      <p className="stencil text-[8px] tracking-[0.14em] text-primary">Checkout total</p>
                      <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                        Order Summary
                      </h2>
                    </div>
                  </div>
                  <div className="mt-3">
                    <StoreCurrencyNote baseCurrency={currency} />
                  </div>

                  <div className="mt-6 space-y-4 rounded-lg border border-border bg-black/35 p-4 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Items</span>
                      <span className="text-fg">{itemCount}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted">Merchandise subtotal</span>
                      <span className="font-semibold text-fg">
                        <StoreMoney amount={subtotal} currency={currency} />
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-4">
                      <span className="text-muted">Shipping</span>
                      <span className="text-right text-fg">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-5">
                    <span className="font-display text-lg font-semibold uppercase text-fg">
                      Cart Subtotal
                    </span>
                    <span className="font-display text-3xl font-semibold text-primary">
                      <StoreMoney amount={subtotal} currency={currency} />
                    </span>
                  </div>

                  <Button asChild size="lg" className="mt-6 w-full">
                    <Link to="/store/checkout">Continue to Checkout</Link>
                  </Button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                    {access.settings.cartNotice}
                  </p>
                </aside>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
