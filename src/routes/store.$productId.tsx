import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  Minus,
  PackageOpen,
  Plus,
  ShieldCheck,
  ShoppingCart,
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
  parseMoney,
  productIsPurchasable,
  productPrice,
  productPrimaryImage,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/$productId")({
  component: StoreProductPage,
  head: () => ({ meta: [{ title: "Product — 1st M.I. Store" }] }),
});

const CUSTOM_PRINT_PRODUCT_SLUG = "1st-m-i-3d-printed-logo";

function StoreProductPage() {
  const { productId } = Route.useParams();
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
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

  const product = useMemo(() => {
    if (!access?.visible) return null;
    const decoded = decodeURIComponent(productId);
    const found = access.settings.products.find(
      (item) => item.slug === decoded || item.id === decoded,
    );
    if (!found) return null;
    if (!access.leadershipPreview && found.status !== "published") return null;
    if (found.status === "archived") return null;
    return found;
  }, [access, productId]);

  const activeVariants = useMemo(
    () => product?.variants.filter((variant) => variant.active) ?? [],
    [product],
  );

  const variant = activeVariants.find((item) => item.id === variantId) ?? null;
  const price = product ? productPrice(product, variant) : 0;
  const canAdd = product ? productIsPurchasable(product, variant) && price > 0 : false;
  const hasCustomPrintRequest = product?.slug === CUSTOM_PRINT_PRODUCT_SLUG;

  if (!access && !failed) {
    return <AppShell><div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">Loading product…</div></AppShell>;
  }

  if (failed || !access?.visible || !product) {
    return (
      <AppShell>
        <PageHero kicker="404" title="Product Not Available" body="This product is not currently available." meta="1ST MI DIV · QUARTERMASTER" />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="panel panel-static p-8">
            <EyeOff className="mx-auto h-8 w-8 text-muted" />
            <Button asChild variant="secondary" className="mt-6"><Link to="/store"><ArrowLeft className="h-4 w-4" />Back to Store</Link></Button>
          </div>
        </section>
      </AppShell>
    );
  }

  const images = product.images.length
    ? product.images
    : productPrimaryImage(product)
      ? [{ id: "primary", url: productPrimaryImage(product), alt: product.name }]
      : [];
  const currentImage = images[selectedImage] ?? images[0];

  function addToCart() {
    if (!canAdd) return;
    cart.add(product.id, variant?.id || "", quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  }

  const customRequestUrl = `/store/custom-3d-print?source=${encodeURIComponent(product.name)}&product=${encodeURIComponent(product.slug)}`;

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

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/store" className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" />Back to Store
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="overflow-hidden rounded-xl border border-border bg-black/45">
              <div className="aspect-square sm:aspect-[4/3]">
                {currentImage ? (
                  <img src={currentImage.url} alt={currentImage.alt || product.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center"><PackageOpen className="h-14 w-14 text-muted" /></div>
                )}
              </div>
            </div>
            {images.length > 1 ? (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-md border bg-black/40 ${selectedImage === index ? "border-primary" : "border-border"}`}
                  >
                    <img src={image.url} alt={image.alt || product.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel panel-feature p-6 sm:p-8">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">{product.category}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold uppercase tracking-wide text-fg sm:text-5xl">{product.name}</h1>
            {product.sku ? <p className="mt-2 font-mono text-[10px] text-subtle">SKU {product.sku}</p> : null}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <p className="font-display text-3xl font-semibold text-primary">{price > 0 ? <StoreMoney amount={price} currency={product.currency} /> : "Price pending"}</p>
              {parseMoney(product.compareAtPrice) > price && price > 0 ? (
                <p className="text-lg text-muted line-through"><StoreMoney amount={parseMoney(product.compareAtPrice)} currency={product.currency} /></p>
              ) : null}
            </div>
            <div className="mt-1"><StoreCurrencyNote baseCurrency={product.currency} /></div>

            {product.description ? <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted sm:text-base">{product.description}</p> : null}

            {activeVariants.length || hasCustomPrintRequest ? (
              <div className="mt-7">
                <p className="stencil text-[10px] tracking-[0.12em] text-primary">Product options</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">Choose the normal product, one of its priced options, or request a custom 3D print quote.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={product.trackStock && product.stockQuantity <= 0}
                    onClick={() => setVariantId("")}
                    className={`rounded-md border p-3 text-left transition-colors ${variantId === "" ? "border-primary bg-primary/10" : "border-border bg-black/25 hover:border-primary/45"} ${product.trackStock && product.stockQuantity <= 0 ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    <p className="font-display text-base font-semibold uppercase tracking-wide text-fg">Standard product</p>
                    <p className="mt-1 text-xs text-muted">No optional selection</p>
                    <p className="mt-2 font-mono text-[10px] text-subtle">
                      {parseMoney(product.price) > 0 ? <StoreMoney amount={parseMoney(product.price)} currency={product.currency} /> : "Price pending"}
                      {product.trackStock ? ` · ${product.stockQuantity} in stock` : ""}
                    </p>
                  </button>

                  {activeVariants.map((item) => {
                    const soldOut = product.trackStock && item.stockQuantity <= 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setVariantId(item.id)}
                        className={`rounded-md border p-3 text-left transition-colors ${variantId === item.id ? "border-primary bg-primary/10" : "border-border bg-black/25 hover:border-primary/45"} ${soldOut ? "cursor-not-allowed opacity-45" : ""}`}
                      >
                        <p className="font-display text-base font-semibold uppercase tracking-wide text-fg">{item.name}</p>
                        {item.options.length ? <p className="mt-1 text-xs text-muted">{item.options.map((option) => `${option.name}: ${option.value}`).join(" · ")}</p> : null}
                        <p className="mt-2 font-mono text-[10px] text-subtle">
                          {item.price?.trim() ? <StoreMoney amount={productPrice(product, item)} currency={product.currency} /> : <>Same price · <StoreMoney amount={productPrice(product, item)} currency={product.currency} /></>}
                          {product.trackStock ? ` · ${item.stockQuantity} in stock` : ""}
                        </p>
                      </button>
                    );
                  })}

                  {hasCustomPrintRequest ? (
                    <a
                      href={customRequestUrl}
                      className="rounded-md border border-primary/45 bg-primary/5 p-3 text-left transition-colors hover:border-primary hover:bg-primary/10"
                    >
                      <p className="font-display text-base font-semibold uppercase tracking-wide text-fg">Custom 3D Print Request</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">For a different size, shape, design or completely custom print. Staff will discuss the design and price with you first.</p>
                      <p className="mt-2 font-mono text-[10px] text-primary">REQUEST A QUOTE · PRICE SET WITH STAFF</p>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-7 rounded-md border border-border bg-black/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="stencil text-[9px] tracking-[0.12em] text-primary">Availability</p>
                  <p className="mt-1 text-sm text-fg">{product.trackStock ? `${variant ? variant.stockQuantity : product.stockQuantity} available` : product.stockStatus}</p>
                </div>
                <div className="flex items-center rounded-md border border-border-strong bg-black/45">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-2.5 text-muted hover:text-fg" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                  <span className="min-w-10 text-center font-mono text-sm text-fg">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="p-2.5 text-muted hover:text-fg" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <Button type="button" size="lg" className="mt-4 w-full" disabled={!canAdd} onClick={addToCart}>
                {added ? <><CheckCircle2 className="h-4 w-4" />Added to Cart</> : <><ShoppingCart className="h-4 w-4" />{canAdd ? "Add to Cart" : "Unavailable"}</>}
              </Button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted">Payment is not connected yet. Adding an item only saves it to your local cart.</p>
            </div>

            {product.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.map((tag) => <span key={tag} className="rounded-full border border-border bg-black/30 px-2.5 py-1 text-[10px] text-muted">{tag}</span>)}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
