import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LiveSiteContent } from "@/components/live-site-content";
import { LiveSiteAdminAppearance } from "@/components/live-site-admin-appearance";
import { LeadershipStoreControl } from "@/components/leadership-store-control";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const showStoreAdminNav =
    pathname === "/leadership-store" ||
    pathname.startsWith("/leadership-store/orders");

  return (
    <div className="flex min-h-dvh flex-col">
      <style>{`
        /* Let the site make proper use of large desktop and ultrawide displays.
           Existing mobile/tablet spacing remains unchanged. */
        @media (min-width: 1024px) {
          .max-w-6xl {
            max-width: min(96vw, 1600px) !important;
          }
        }
      `}</style>
      <LiveSiteContent />
      <LiveSiteAdminAppearance />
      <SiteHeader />
      {showStoreAdminNav ? (
        <div className="border-b border-primary/20 bg-black/75 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
            <span className="mr-2 stencil text-[9px] tracking-[0.14em] text-primary">
              Quartermaster Admin
            </span>
            <Link
              to="/leadership-store"
              className={`rounded-md border px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                pathname === "/leadership-store"
                  ? "border-primary bg-primary text-black"
                  : "border-border-strong bg-black/30 text-fg hover:border-primary/50"
              }`}
            >
              Store Manager
            </Link>
            <Link
              to="/leadership-store/orders"
              className={`rounded-md border px-3 py-2 font-display text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                pathname.startsWith("/leadership-store/orders")
                  ? "border-primary bg-primary text-black"
                  : "border-border-strong bg-black/30 text-fg hover:border-primary/50"
              }`}
            >
              Store Orders
            </Link>
          </div>
        </div>
      ) : null}
      <main className="flex-1">{children}</main>
      <LeadershipStoreControl />
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  kicker,
  title,
  body,
  meta,
}: {
  kicker: string;
  title: string;
  body?: string;
  meta?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 0%, color-mix(in oklab, var(--color-primary) 16%, transparent), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="section-kicker">{kicker}</p>
        <h1 className="hero-title mt-3 text-[clamp(2.4rem,6vw,3.75rem)] font-semibold leading-[0.95] text-fg">
          {title}
        </h1>
        {body ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{body}</p>
        ) : null}
        {meta ? (
          <p className="mt-4 font-mono text-xs text-subtle">{meta}</p>
        ) : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="section-kicker">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold uppercase tracking-wide text-fg sm:text-4xl">
        {title}
      </h2>
      {body ? <p className="mt-3 text-base leading-relaxed text-muted">{body}</p> : null}
    </div>
  );
}
