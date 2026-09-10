import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, Layers3, PackageOpen, ShieldCheck } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreCurrencyNote } from "@/components/store-price";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";

export const Route = createFileRoute("/store/categories")({
  component: StoreCategoriesPage,
  head: () => ({ meta: [{ title: "Categories — 1st M.I. Store" }] }),
});

function StoreCategoriesPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);

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

  const categories = useMemo(() => {
    if (!access?.visible) return [];
    return access.settings.categories.filter(
      (category) => access.leadershipPreview || category.visible,
    );
  }, [access]);

  const products = useMemo(() => {
    if (!access?.visible) return [];
    return access.leadershipPreview
      ? access.settings.products.filter((product) => product.status !== "archived")
      : access.settings.products.filter((product) => product.status === "published");
  }, [access]);

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted sm:px-6">
          Loading categories…
        </div>
      </AppShell>
    );
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero kicker="404" title="Page Not Available" body="The Store is not currently available." meta="1ST MI DIV · PUBLIC SITE" />
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <EyeOff className="mx-auto h-8 w-8 text-muted" />
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/"><ArrowLeft className="h-4 w-4" />Back to Home</Link>
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
            <p className="flex items-center gap-2 text-sm text-amber-100"><ShieldCheck className="h-4 w-4" />Leadership Store preview</p>
            <Link to="/leadership-store" className="stencil text-[10px] tracking-[0.12em] text-amber-100">Store Manager</Link>
          </div>
        </div>
      ) : null}

      <StoreToolbar />
      <PageHero
        kicker="Quartermaster catalogue"
        title="Store Categories"
        body="Browse 1st M.I. merchandise by supply category."
        meta="1ST MI DIV · QUARTERMASTER SUPPLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Supply divisions</p>
            <p className="mt-1 text-sm text-muted">{categories.length} categor{categories.length === 1 ? "y" : "ies"} available</p>
            <div className="mt-2"><StoreCurrencyNote baseCurrency={access.settings.defaultCurrency} /></div>
          </div>
          <Button asChild variant="secondary"><Link to="/store"><ArrowLeft className="h-4 w-4" />All Products</Link></Button>
        </div>

        {categories.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => {
              const count = products.filter((product) => product.category === category.name).length;
              return (
                <a
                  key={category.id}
                  href={`/store/category/${encodeURIComponent(category.slug)}`}
                  className="panel panel-lift group block p-6 sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <Layers3 className="h-5 w-5" />
                    </span>
                    <span className="rounded-md border border-border bg-black/30 px-2.5 py-1 font-mono text-[10px] text-muted">
                      {count} item{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-semibold uppercase tracking-wide text-fg transition-colors group-hover:text-primary">
                    {category.name}
                  </h2>
                  <p className="mt-3 min-h-12 text-sm leading-relaxed text-muted">
                    {category.description || `Browse ${category.name} from the 1st M.I. Quartermaster catalogue.`}
                  </p>
                  <p className="mt-5 stencil text-[10px] tracking-[0.12em] text-primary">Open Category →</p>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="panel panel-static px-6 py-14 text-center">
            <PackageOpen className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">No categories configured</h2>
          </div>
        )}
      </section>
    </AppShell>
  );
}
