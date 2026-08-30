import type { ReactNode } from "react";
import { LiveSiteContent } from "@/components/live-site-content";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({ children }: { children: ReactNode }) {
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
      <SiteHeader />
      <main className="flex-1">{children}</main>
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
