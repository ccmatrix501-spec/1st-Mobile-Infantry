import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Crosshair,
  Flame,
  Fuel,
  GraduationCap,
  Heart,
  Radio,
  Scale,
  Shield,
  Swords,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell, SectionHeading } from "@/components/app-shell";
import { BugsKilledCounter } from "@/components/bugs-killed-counter";
import { DropshipCounter } from "@/components/dropship-counter";
import { Button } from "@/components/ui/button";
import {
  campaigns,
  companies,
  doctrine,
  stats,
  unit,
} from "@/data/unit";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [{ title: "Home — 1st Mobile Infantry" }],
  }),
});

function HomePage() {
  return (
    <AppShell>
      <Hero />
      <StatsStrip />
      <DoctrineSection />
      <CompaniesSection />
      <CampaignsSection />
      <CtaBand />
    </AppShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 50% at 75% 10%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 55%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
        <div className="reveal">
          <p className="badge-live stencil inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] tracking-[0.14em] text-primary">
            {unit.status}
          </p>
          <h1 className="hero-title mt-5 text-[clamp(2.75rem,8vw,4.75rem)] font-semibold leading-[0.92] text-fg">
            1st Mobile
            <br />
            <span className="text-primary">Infantry</span>
          </h1>
          <p className="motto-banner mt-5 max-w-2xl rounded-sm border border-primary/60 bg-primary px-4 py-3.5 font-display text-[clamp(1.2rem,3.4vw,1.85rem)] font-bold uppercase leading-[1.15] tracking-[0.05em] text-black shadow-[0_0_48px_color-mix(in_oklab,var(--color-primary)_60%,transparent),inset_0_1px_0_color-mix(in_oklab,white_40%,transparent)] sm:px-5 sm:py-4">
            {unit.motto}
          </p>
          <p className="mt-3 font-display text-lg font-semibold uppercase tracking-[0.1em] text-muted sm:text-xl">
            {unit.secondaryMotto}
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Four companies. Four active theaters. Demon holds the ARC, Nightmare
            fuels the war, Cerberus answers the call, Hellfire ends the bugs.{" "}
            {unit.tagline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/join">
                Join Now!
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/rules">Unit rules</Link>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:max-w-md">
            <div>
              <dt className="stencil text-[10px] tracking-[0.12em] text-subtle">Established</dt>
              <dd className="mt-1 font-mono text-sm text-fg">{unit.established}</dd>
            </div>
            <div>
              <dt className="stencil text-[10px] tracking-[0.12em] text-subtle">Home base</dt>
              <dd className="mt-1 font-mono text-sm text-fg">{unit.homebase}</dd>
            </div>
          </dl>
        </div>

        <div className="reveal stagger-2">
          <div className="panel panel-feature p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-subtle">Unit emblem</p>
                <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  1st Division
                </p>
              </div>
              <span className="font-mono text-xs text-muted">MI · 1ST DIV</span>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="overflow-hidden rounded-md border border-border-strong bg-black p-2 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_30%,transparent),0_0_40px_color-mix(in_oklab,var(--color-primary)_20%,transparent)]">
                <img
                  src="/mi-emblem.jpg"
                  alt="1st Mobile Infantry emblem"
                  width={240}
                  height={240}
                  className="aspect-square w-52 object-cover sm:w-56"
                  decoding="async"
                />
              </div>
            </div>
            <ul className="mt-6 space-y-2 border-t border-border pt-4">
              {[
                { icon: Crosshair, text: "Four specialized line companies" },
                { icon: Target, text: "ARC · logistics · QRF · hunt" },
                { icon: Radio, text: "Division net integrated" },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-center gap-3 rounded-md bg-bg/40 px-3 py-2.5 text-sm text-muted"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className="border-b border-border py-10 sm:py-12" aria-label="Unit statistics">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-6">
        {stats.map((stat, i) => (
          <div key={stat.id} className={`bento-stat reveal stagger-${i + 1} px-5 py-6 sm:px-6`}>
            {stat.id === "bugs" ? (
              <BugsKilledCounter />
            ) : stat.id === "dropships" ? (
              <DropshipCounter />
            ) : (
              <p className="metric-value text-3xl text-fg sm:text-4xl">{stat.value}</p>
            )}
            <p className="stencil mt-3 text-[11px] tracking-[0.12em] text-muted">{stat.label}</p>
            {stat.id === "bugs" ? (
              <p className="badge-live mt-2 stencil text-[10px] tracking-[0.12em] text-primary">
                Live feed · real-time
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function DoctrineSection() {
  const icons = [Heart, Scale, Swords, GraduationCap];
  return (
    <section id="doctrine" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          kicker="Core values"
          title="How the 1st stands"
          body="Four pillars drilled from boot through senior command."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {doctrine.map((item, i) => {
            const Icon = icons[i] ?? Shield;
            return (
              <article key={item.title} className="panel panel-lift p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="icon-bubble h-11 w-11 shrink-0">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="stencil text-[10px] tracking-[0.14em] text-subtle">
                      0{i + 1}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">
                      {item.title}
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CompanyMark({
  logo,
  Icon,
  name,
}: {
  logo: string | null;
  Icon: LucideIcon;
  name: string;
}) {
  if (logo) {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong bg-black shadow-[0_0_0_1px_color-mix(in_oklab,#ef4444_25%,transparent),0_0_20px_color-mix(in_oklab,#ef4444_15%,transparent)]">
        <img
          src={logo}
          alt={`${name} company logo`}
          width={56}
          height={56}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </span>
    );
  }
  return (
    <span className="icon-bubble h-14 w-14 shrink-0">
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

function CompaniesSection() {
  const icons = [Shield, Fuel, Radio, Flame];
  return (
    <section id="companies" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          kicker="Order of battle"
          title="The four companies"
          body="Each company owns a warfighting mission. Together they build, feed, reinforce, and burn the enemy off the map."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {companies.map((co, i) => {
            const Icon = icons[i] ?? Shield;
            return (
              <article key={co.callsign} className="panel panel-lift flex flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <CompanyMark logo={co.logo} Icon={Icon} name={co.callsign} />
                    <div>
                      <p className="stencil text-[10px] tracking-[0.12em] text-subtle">
                        {co.code} · {co.role}
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                        {co.callsign}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-muted">
                        Capt. {co.captain}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-sm border border-primary/35 bg-primary/10 px-2.5 py-1 stencil text-[10px] tracking-[0.1em] text-primary">
                    {co.winCon}
                  </span>
                </div>
                {co.logo ? (
                  <div className="mt-5 flex justify-center rounded-md border border-border bg-black/60 p-4">
                    <img
                      src={co.logo}
                      alt=""
                      width={160}
                      height={160}
                      className="h-28 w-28 object-contain sm:h-32 sm:w-32"
                      decoding="async"
                    />
                  </div>
                ) : null}
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{co.summary}</p>
                <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  {co.traits.map((t) => (
                    <li key={t} className="chip">
                      {t}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const planetClass: Record<string, string> = {
  Valaka: "planet-valaka",
  "Agni Prime": "planet-agni",
  Boreas: "planet-boreas",
  "X-11": "planet-x11",
};

function CampaignsSection() {
  return (
    <section id="theaters" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          kicker="Active theaters"
          title="The four planets"
          body="Valaka, Agni Prime, Boreas, and X-11. All ongoing."
        />
        <div className="mt-10 space-y-4">
          {campaigns.map((c) => (
            <article
              key={c.code}
              className={`panel panel-lift planet-rail grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-6 sm:p-6 ${planetClass[c.name] ?? ""}`}
            >
              <div>
                <p className="font-mono text-xs text-primary">{c.code}</p>
                <p className="mt-1 font-mono text-xs text-subtle">{c.year}</p>
              </div>
              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">
                    {c.name}
                  </h2>
                  <p className="font-mono text-[11px] text-subtle">{c.terrain}</p>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{c.brief}</p>
              </div>
              <span className="inline-flex h-8 items-center justify-self-start rounded-sm border border-primary/35 bg-primary/10 px-2.5 stencil text-[10px] tracking-[0.1em] text-primary sm:justify-self-end">
                {c.outcome}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="bg-bg-elevated">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-16">
        <div>
          <p className="section-kicker">Next steps</p>
          <h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
            Know the chain. Know the rules. Then join.
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            Leadership, standing rules, and Join Now! live on their own pages.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/join">Join Now!</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/leadership">Leadership</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/rules">Rules</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
