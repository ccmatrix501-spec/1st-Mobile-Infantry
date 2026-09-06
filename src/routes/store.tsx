import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, PackageOpen, ShieldCheck, ShoppingBag } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [{ title: "Store — 1st Mobile Infantry" }],
  }),
});

function StorePage() {
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

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-center text-muted sm:px-6">
          Loading…
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
            <Link to="/leadership-control" className="stencil text-[11px] tracking-[0.12em] text-amber-100 hover:text-white">
              Store Settings
            </Link>
          </div>
        </div>
      ) : null}

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

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel panel-feature p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Supply Manifest</p>
                <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
                  Store Inventory
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  This page is ready for 1st M.I. merchandise. Product cards, prices, sizes, stock status and checkout links can be added here as the Store is built out.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-black/25 px-5 py-10 text-center">
              <PackageOpen className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-4 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                Inventory manifest pending
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {settings.statusText}
              </p>
            </div>
          </div>

          <aside className="panel panel-static p-6 sm:p-7">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Store Status</p>
            <p className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              {settings.enabled ? "Public" : "Leadership Preview"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {settings.statusText}
            </p>
            {leadershipPreview ? (
              <Button asChild className="mt-6 w-full">
                <Link to="/leadership-control">Return to Leadership Control</Link>
              </Button>
            ) : null}
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
