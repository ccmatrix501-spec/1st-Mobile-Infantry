import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  EyeOff,
  PackageOpen,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreCurrencyNote, StoreProductPrice } from "@/components/store-price";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import { useStoreCart } from "@/lib/store-cart";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";
import type { StoreProduct } from "@/lib/store-settings";
import {
  productIsPurchasable,
  productPrice,
  productPrimaryImage,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/category/$categorySlug")({
  component: StoreCategoryPage,
  head: () => ({ meta: [{ title: "Category — 1st M.I. Store" }] }),
});

type SortMode = "featured" | "name" | "price-low" | "price-high";

function StoreCategoryPage() {
  const { categorySlug } = Route.useParams();
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
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

  const category = useMemo(() => {
    if (!access?.visible) return null;
    const decoded = decodeURIComponent(categorySlug);
    const found = access.settings.categories.find(
      (item) => item.slug === decoded || item.id === decoded,
    );
    if (!found) return null;
    if (!access.leadershipPreview && !found.visible) return null;
    return found;
  }, [access, categorySlug]);

  const products = useMemo(() => {
    if (!access?.visible || !category) return [];
    const source = access.leadershipPreview
      ? access.settings.products.filter((product) => product.status !== "archived")
      : access.settings.products.filter((product) => product.status === "published");

    const needle = query.trim().toLowerCase();
    const filtered = source.filter((product) => {
      if (product.category !== category.name) return false;
      if (!needle) return true;
      return [product.name, product.description, product.sku, ...product.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "price-low") return productPrice(a) - productPrice(b);
      if (sort === "price-high") return productPrice(b) - productPrice(a);
      return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name);
    });
  }, [access, category, query, sort]);

  if (!access && !failed) {
    return <AppShell><div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted sm:px-6">Loading category…</div></AppShell>;
  }

  if (failed || !access?.visible || !category) {
    return (
      <AppShell>
        <PageHero kicker="404" title="Category Not Available" body="This Store category is not currently available." meta="1ST MI DIV · QUARTERMASTER" />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <EyeOff className="mx-auto h-8 w-8 text-muted" />
          <Button asChild variant="secondary" className="mt-6"><Link to="/store"><ArrowLeft className="h-4 w-4" />Back to Store</Link></Button>
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
      <PageHero
        kicker="Store category"
        title={category.name}
        body={category.description || `Browse ${category.name} from the 1st M.I. Quartermaster catalogue.`}
        meta="1ST MI DIV · QUARTERMASTER SUPPLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">{products.length} item{products.length === 1 ? "" : "s"}</p>
            <div className="mt-2"><StoreCurrencyNote baseCurrency={access.settings.defaultCurrency} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary"><a href="/store/categories">All Categories</a></Button>
            <Button asChild variant="secondary"><Link to="/store"><ArrowLeft className="h-4 w-4" />All Products</Link></Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${category.name}…`}
              className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 text-sm text-fg outline-none focus:border-primary/70"
            />
          </label>
          <label className="relative flex items-center">
            <SlidersHorizontal className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-11 min-w-48 rounded-md border border-border-strong bg-black/45 pl-10 pr-8 text-sm text-fg outline-none focus:border-primary/70"
            >
              <option value="featured">Featured first</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price low–high</option>
              <option value="price-high">Price high–low</option>
            </select>
          </label>
        </div>

        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <CategoryProductCard
                key={product.id}
                product={product}
                leadershipPreview={access.leadershipPreview}
                categorySlug={category.slug}
                onQuickAdd={() => cart.add(product.id, "", 1)}
              />
            ))}
          </div>
        ) : (
          <div className="panel panel-static px-6 py-14 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">No matching products</h2>
            <p className="mt-2 text-sm text-muted">There are no visible items in this category matching your search.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function CategoryProductCard({
  product,
  leadershipPreview,
  categorySlug,
  onQuickAdd,
}: {
  product: StoreProduct;
  leadershipPreview: boolean;
  categorySlug: string;
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
          {product.featured ? <span className="absolute left-3 top-3 rounded-md border border-primary/35 bg-black/80 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-primary">Featured</span> : null}
          {leadershipPreview && product.status !== "published" ? <span className="absolute right-3 top-3 rounded-md border border-amber-300/35 bg-black/80 px-2.5 py-1 stencil text-[9px] tracking-[0.12em] text-amber-200">{product.status}</span> : null}
        </div>
      </a>

      <div className="p-5 sm:p-6">
        <a href={`/store/category/${encodeURIComponent(categorySlug)}`} className="stencil text-[9px] tracking-[0.14em] text-primary hover:text-fg">{product.category}</a>
        <a href={`/store/${encodeURIComponent(product.slug)}`} className="block hover:text-primary">
          <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{product.name}</h2>
        </a>
        <p className="mt-2 font-display text-xl font-semibold text-primary"><StoreProductPrice product={product} /></p>
        {product.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{product.description}</p> : null}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs text-muted">{product.stockStatus || "Available"}</span>
          {canQuickAdd ? (
            <Button type="button" size="sm" onClick={onQuickAdd}><ShoppingCart className="h-3.5 w-3.5" />Add to Cart</Button>
          ) : (
            <Button asChild size="sm" variant="secondary"><a href={`/store/${encodeURIComponent(product.slug)}`}>{hasVariants ? "Select Options" : "View Product"}</a></Button>
          )}
        </div>
      </div>
    </article>
  );
}
