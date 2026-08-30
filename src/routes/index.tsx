import type { CSSProperties } from "react";
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
import { TrooperCounter } from "@/components/trooper-counter";
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
            Five companies. Five active theaters. Demon holds the ARC, Cerberus
            answers the call, Nightmare fuels the war, Hellfire hunts the enemy,
            and Alpha drives the fifth line. {unit.tagline}
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
          <div className="emblem-id relative overflow-hidden rounded-sm border border-primary/35 bg-bg-elevated">
            <div className="relative flex items-center justify-between gap-3 border-b border-primary/25 bg-primary/10 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <p className="stencil text-[10px] tracking-[0.16em] text-primary">Unit ID · live</p>
              </div>
              <p className="font-mono text-[10px] tracking-wider text-muted">FILE · MI-1ST-DIV</p>
            </div>

            <div className="relative p-5 sm:p-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                aria-hidden
                style={{
                  backgroundImage:
                    "linear-gradient(color-mix(in oklab, var(--color-primary) 50%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-primary) 50%, transparent) 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="stencil text-[10px] tracking-[0.16em] text-subtle">Command plate</p>
                  <p className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-fg sm:text-3xl">
                    1st Division
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">{unit.designation}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="rounded-sm border border-primary bg-primary px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-black">
                    MI · 1ST DIV
                  </span>
                  <span className="stencil text-[9px] tracking-[0.14em] text-primary">Drop ready</span>
                </div>
              </div>

              <div className="relative mt-6 flex flex-col items-center">
                <div
                  className="pointer-events-none absolute top-1/2 h-40 w-40 -translate-y-1/2 rounded-full opacity-70 sm:h-48 sm:w-48"
                  aria-hidden
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--color-primary) 40%, transparent) 0%, transparent 70%)",
                  }}
                />
                <div className="relative rounded-sm border border-primary/60 bg-black p-1.5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_30%,transparent),0_0_48px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]">
                  <div className="relative overflow-hidden rounded-[2px] border border-border-strong bg-black">
                    <img
                      src="/mi-emblem.jpg"
                      alt="1st Mobile Infantry emblem"
                      width={280}
                      height={280}
                      className="aspect-square w-44 object-cover sm:w-52"
                      decoding="async"
                    />
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-primary/20" />
                  </div>
                </div>
                <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.22em] text-fg">
                  Mobile Infantry
                </p>
                <p className="mt-1 max-w-[16rem] text-center font-mono text-[10px] leading-relaxed tracking-wide text-muted">
                  {unit.motto}
                </p>
              </div>

              <div className="relative mt-6 grid gap-2">
                {[
                  { icon: Crosshair, label: "Order of battle", text: "Five specialized line companies" },
                  { icon: Target, label: "Mission set", text: "ARC · logistics · QRF · hunt" },
                  { icon: Radio, label: "Comms net", text: "Division net integrated" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-sm border border-border bg-bg/55 px-3 py-2.5 transition-colors hover:border-primary/45 hover:bg-primary/[0.06]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/35 bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="stencil text-[9px] tracking-[0.14em] text-primary">{item.label}</p>
                      <p className="mt-0.5 text-sm text-fg">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative mt-5 border-t border-primary/20 pt-4">
                <p className="stencil mb-2.5 text-[9px] tracking-[0.14em] text-subtle">Companies · active</p>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { name: "Demon", logo: "/company-demon.png" },
                    { name: "Cerberus", logo: "/company-cerberus.png" },
                    { name: "Nightmare", logo: "/company-nightmare.png" },
                    { name: "Hellfire", logo: "/company-hellfire.png" },
                    { name: "Alpha", logo: "/company-alpha.png" },
                  ].map((co) => (
                    <div
                      key={co.name}
                      className="flex min-w-0 flex-col items-center gap-1.5 rounded-sm border border-border bg-bg/50 p-1.5 sm:p-2"
                    >
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm border border-border-strong bg-black sm:h-9 sm:w-9">
                        <img
                          src={co.logo}
                          alt=""
                          width={36}
                          height={36}
                          className="h-full w-full object-contain"
                          decoding="async"
                        />
                      </span>
                      <span className="max-w-full truncate font-mono text-[7px] tracking-[0.04em] text-muted sm:text-[8px] sm:tracking-[0.08em]">
                        {co.name.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            ) : stat.id === "troopers" ? (
              <TrooperCounter />
            ) : stat.id === "companies" ? (
              <p className="metric-value text-3xl text-fg sm:text-4xl">5</p>
            ) : (
              <p className="metric-value text-3xl text-fg sm:text-4xl">{stat.value}</p>
            )}
            <p className="stencil mt-3 text-[11px] tracking-[0.12em] text-muted">
              {stat.id === "dropships" ? "Total Operations completed" : stat.label}
            </p>
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
        <div className="mb-10 flex flex-col gap-4 border-b border-primary/20 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Core values</p>
            <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3rem)] font-bold uppercase leading-[0.95] tracking-wide text-fg">
              How the 1st{" "}
              <span className="text-primary">stands</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Four pillars drilled from boot through senior command. Non-negotiable under fire.
            </p>
          </div>
          <div className="shrink-0 rounded-sm border border-primary/35 bg-primary/10 px-4 py-3 text-left sm:text-right">
            <p className="font-mono text-[10px] tracking-[0.16em] text-primary">Doctrine · 1ST MI DIV</p>
            <p className="mt-1 font-display text-sm font-semibold uppercase tracking-wide text-fg">
              Hold the line
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doctrine.map((item, i) => {
            const Icon = icons[i] ?? Shield;
            const n = String(i + 1).padStart(2, "0");
            return (
              <article
                key={item.title}
                className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-bg-elevated transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-primary/55 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent),0_20px_48px_color-mix(in_oklab,black_50%,transparent)]"
              >
                <div className="flex items-center justify-between border-b border-primary/20 bg-primary/10 px-4 py-2.5">
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-primary">
                    {n}
                  </span>
                  <span className="stencil text-[9px] tracking-[0.14em] text-subtle">
                    Pillar
                  </span>
                </div>

                <div className="relative flex flex-1 flex-col p-5">
                  <span
                    className="pointer-events-none absolute -right-2 bottom-0 font-display text-[6.5rem] font-bold leading-none text-primary/[0.05] transition-colors group-hover:text-primary/[0.1]"
                    aria-hidden
                  >
                    {n}
                  </span>

                  <span className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-primary/45 bg-primary text-black shadow-[0_0_24px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>

                  <h3 className="relative font-display text-xl font-bold uppercase tracking-wide text-fg sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>

                  <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-3">
                    <span className="h-px flex-1 bg-primary/30" aria-hidden />
                    <span className="font-mono text-[9px] tracking-[0.16em] text-primary/80">
                      1ST MI
                    </span>
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
          title="The five companies"
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
  Vietnam: "planet-vietnam",
};

const vietnamCampaign = {
  code: "AO-VIETNAM",
  name: "Vietnam",
  year: "FY 1968",
  outcome: "Ongoing",
  terrain: "Jungle · rivers · FOBs · air mobile",
  brief:
    "Dense jungle, muddy patrol routes, river crossings, fortified FOBs, and helicopter mobility define the Vietnam theater. Close-range firefights and coordinated air-mobile operations keep the 1st fighting across a very different battlefield.",
};

const activeCampaigns = [...campaigns, vietnamCampaign];

function CampaignsSection() {
  return (
    <section id="theaters" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          kicker="Active theaters"
          title="The five theaters"
          body="Valaka, Agni Prime, Boreas, X-11, and Vietnam. All ongoing."
        />
        <div className="mt-10 space-y-4">
          {activeCampaigns.map((c) => (
            <article
              key={c.code}
              className={`panel panel-lift planet-rail grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-6 sm:p-6 ${planetClass[c.name] ?? ""}`}
              style={
                c.name === "Vietnam"
                  ? ({
                      "--planet-art":
                        'url("/site-bg.png"), linear-gradient(145deg, #122015, #050705)',
                    } as CSSProperties)
                  : undefined
              }
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