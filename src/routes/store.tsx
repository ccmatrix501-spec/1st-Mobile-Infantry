import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  EyeOff,
  PackageOpen,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import { useStoreCart } from "@/lib/store-cart";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";
import type { StoreProduct } from "@/lib/store-settings";
import {
  productDisplayPrice,
  productIsPurchasable,
  productPrice,
  productPrimaryImage,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [{ title: "Store — 1st Mobile Infantry" }],
  }),
});

type SortMode = "featured" | "name" | "price-low" | "price-high";

function StorePage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortMode>("featured");
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

  const sourceProducts = useMemo(() => {
    if (!access?.visible) return [];
    return access.leadershipPreview
      ? access.settings.products.filter((product) => product.status !== "archived")
      : access.settings.products.filter((product) => product.status === "published");
  }, [access]);

  const categories = useMemo(() => {
    if (!access?.visible) return [];
    return access.settings.categories.filter(
      (item) => access.leadershipPreview || item.visible,
    );
  }, [access]);

  const displayProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = sourceProducts.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (!needle) return true;
      const haystack = [
        product.name,
        product.description,
        product.category,
        product.sku,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-low") return productPrice(a) - productPrice(b);
      if (sort === "price-high") return productPrice(b) - productPrice(a);
      return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name);
    });
  }, [category, query, sort, sourceProducts]);

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-center text-muted sm:px-6">
          Loading Store…
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
          body="The requested page is not currently available."
          meta="1ST MI DIV · PUBLIC SITE"
        />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="panel panel-static p-8 sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-border-strong bg-black/35 text-muted">
              <EyeOff className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Nothing to see here
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Return to the public website using the button below.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />Back to Home
              </Link>
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  const { settings, leadershipPreview } = access;

  return (
    <AppShell>
      {leadershipPreview ? (
        <div className="border-b border-amber-300/25 bg-amber-300/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="flex items-center gap-2 text-sm text-amber-100">
              <ShieldCheck className="h-4 w-4" />
              Leadership preview — the Store is currently hidden from the public.
            </p>
            <Link to="/leadership-store" className="stencil text-[11px] tracking-[0.12em] text-amber-100 hover:text-white">
              Store Manager
            </Link>
          </div>
        </div>
      ) : null}

      <StoreToolbar />

      <PageHero
        kicker={settings.kicker}
        title={settings.title}
        body={settings.body}
        meta="1ST MI DIV · QUARTERMASTER SUPPLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {settings.heroImage ? (
          <div className="mb-8 overflow-hidden rounded-xl border border-primary/25 bg-black shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <img
              src={settings.heroImage}
              alt="1st Mobile Infantry Store"
              className="max-h-[34rem] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-black/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Supply Manifest</p>
              <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
                Store Inventory
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{settings.statusText}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-md border border-primary/25 bg-primary/10 px-4 py-3 text-center">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Items</p>
              <p className="mt-1 font-display text-2xl font-semibold text-fg">{displayProducts.length}</p>
            </div>
            <a href="/store/cart" className="rounded-md border border-border-strong bg-black/35 px-4 py-3 text-center transition-colors hover:border-primary/50">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Cart</p>
              <p className="mt-1 flex items-center justify-center gap-2 font-display text-2xl font-semibold text-fg">
                <ShoppingCart className="h-5 w-5" />{cart.count}
              </p>
            </a>
          </div>
        </div>

        <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, tags or SKU…"
              className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 text-sm text-fg outline-none focus:border-primary/70"
            />
          </label>
          <label className="relative flex items-center">
            <SlidersHorizontal className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 min-w-48 rounded-md border border-border-strong bg-black/45 pl-10 pr-8 text-sm text-fg outline-none focus:border-primary/70"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-11 min-w-44 rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none focus:border-primary/70"
          >
            <option value="featured">Featured first</option>
            <option value="name">Name A–Z</option>
            <option value="price-low">Price low–high</option>
            <option value="price-high">Price high–low</option>
          </select>
        </div>

        {displayProducts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                leadershipPreview={leadershipPreview}
                onQuickAdd={() => cart.add(product.id, "", 1)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong bg-black/25 px-5 py-12 text-center">
            <PackageOpen className="mx-auto h-9 w-9 text-primary" />
            <p className="mt-4 font-display text-xl font-semibold uppercase tracking-wide text-fg">
              No matching supplies
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {sourceProducts.length ? "Try a different search or category." : settings.statusText}
            </p>
          </div>
        )}

        {leadershipPreview ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link to="/leadership-store">Open Store Manager</Link></Button>
            <Button asChild variant="secondary"><Link to="/leadership-media">Media Library</Link></Button>
            <Button asChild variant="secondary"><Link to="/leadership-control">Leadership Control</Link></Button>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}

function ProductCard({
  product,
  leadershipPreview,
  onQuickAdd,
}: {
  product: StoreProduct;
  leadershipPreview: boolean;
  onQuickAdd: () => void;
}) {
  const image = productPrimaryImage(product);
  const hasVariants = product.variants.some((variant) => variant.active);
  const canQuickAdd = !hasVariants && productIsPurchasable(product) && productPrice(product) > 0;

  return (
    <article className="panel panel-lift overflow-hidden">
      <a href={`/store/${encodeURIComponent(product.slug)}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-black/55">
          {image ? (
            <img src={image} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.025]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted"><PackageOpen className="h-10 w-10" /></div>
          )}
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-md border border-primary/35 bg-black/80 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-primary">Featured</span>
          ) : null}
          {leadershipPreview && product.status !== "published" ? (
            <span className="absolute right-3 top-3 rounded-md border border-amber-300/35 bg-black/80 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-amber-200">{product.status}</span>
          ) : null}
        </div>
      </a>

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="stencil text-[9px] tracking-[0.14em] text-primary">{product.category}</p>
            <a href={`/store/${encodeURIComponent(product.slug)}`} className="hover:text-primary">
              <h3 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{product.name}</h3>
            </a>
          </div>
          <p className="shrink-0 font-display text-xl font-semibold text-primary">{productDisplayPrice(product)}</p>
        </div>

        {product.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{product.description}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs text-muted">{product.stockStatus || "Available"}</span>
          {canQuickAdd ? (
            <Button type="button" size="sm" onClick={onQuickAdd}>
              <ShoppingCart className="h-3.5 w-3.5" />Add to Cart
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <a href={`/store/${encodeURIComponent(product.slug)}`}>{hasVariants ? "Select Options" : "View Product"}</a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
