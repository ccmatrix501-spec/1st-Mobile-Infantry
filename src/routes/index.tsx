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
import { campaigns, doctrine, stats, unit } from "@/data/unit";
import type { SiteAdminConfig } from "@/lib/site-admin-config";
import { useSiteAdminConfig } from "@/lib/use-site-admin-config";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({ meta: [{ title: "Home — 1st Mobile Infantry" }] }),
});

function HomePage() {
  const managed = useSiteAdminConfig();
  return (
    <AppShell>
      <Hero managed={managed} />
      <StatsStrip managed={managed} />
      <DoctrineSection />
      <CompaniesSection managed={managed} />
      <CampaignsSection />
      <CtaBand />
    </AppShell>
  );
}

function Hero({ managed }: { managed: SiteAdminConfig }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(ellipse 55% 50% at 75% 10%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 55%)" }} />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-12">
        <div className="reveal">
          <p className="badge-live stencil inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] tracking-[0.14em] text-primary">{unit.status}</p>
          <h1 className="hero-title mt-5 text-[clamp(2.75rem,8vw,4.75rem)] font-semibold leading-[0.92] text-fg">1st Mobile<br /><span className="text-primary">Infantry</span></h1>
          <p className="motto-banner mt-5 max-w-2xl rounded-sm border border-primary/60 bg-primary px-4 py-3.5 font-display text-[clamp(1.2rem,3.4vw,1.85rem)] font-bold uppercase leading-[1.15] tracking-[0.05em] text-black shadow-[0_0_48px_color-mix(in_oklab,var(--color-primary)_60%,transparent)] sm:px-5 sm:py-4">{unit.motto}</p>
          <p className="mt-3 font-display text-lg font-semibold uppercase tracking-[0.1em] text-muted sm:text-xl">{unit.secondaryMotto}</p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">Five companies. Five active theaters. Demon holds the ARC, Cerberus answers the call, Nightmare fuels the war, Hellfire hunts the enemy, and Alpha drives the fifth line. {unit.tagline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/join">Join Now!<ArrowRight aria-hidden /></Link></Button>
            <Button asChild variant="secondary" size="lg"><Link to="/rules">Unit rules</Link></Button>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:max-w-md">
            <div><dt className="stencil text-[10px] tracking-[0.12em] text-subtle">Established</dt><dd className="mt-1 font-mono text-sm text-fg">{unit.established}</dd></div>
            <div><dt className="stencil text-[10px] tracking-[0.12em] text-subtle">Home base</dt><dd className="mt-1 font-mono text-sm text-fg">{unit.homebase}</dd></div>
          </dl>
        </div>

        <div className="reveal stagger-2">
          <div className="emblem-id relative overflow-hidden rounded-sm border border-primary/35 bg-bg-elevated">
            <div className="flex items-center justify-between border-b border-primary/25 bg-primary/10 px-4 py-2.5 sm:px-5">
              <p className="badge-live stencil text-[10px] tracking-[0.16em] text-primary">Unit ID · live</p>
              <p className="font-mono text-[10px] tracking-wider text-muted">FILE · MI-1ST-DIV</p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div><p className="stencil text-[10px] tracking-[0.16em] text-subtle">Command plate</p><p className="mt-1 font-display text-2xl font-bold uppercase tracking-wide text-fg sm:text-3xl">1st Division</p><p className="mt-1 font-mono text-xs text-muted">{unit.designation}</p></div>
                <span className="rounded-sm border border-primary bg-primary px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.12em] text-black">MI · 1ST DIV</span>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <div className="rounded-sm border border-primary/60 bg-black p-1.5 shadow-[0_0_48px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]">
                  <img src={managed.appearance.logoImage} alt="1st Mobile Infantry emblem" width={280} height={280} className="aspect-square w-44 rounded-[2px] object-cover sm:w-52" decoding="async" />
                </div>
                <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.22em] text-fg">Mobile Infantry</p>
                <p className="mt-1 max-w-[16rem] text-center font-mono text-[10px] leading-relaxed tracking-wide text-muted">{unit.motto}</p>
              </div>
              <div className="mt-6 grid gap-2">
                {[
                  { icon: Crosshair, label: "Order of battle", text: `${managed.companies.length} specialized line companies` },
                  { icon: Target, label: "Mission set", text: "ARC · logistics · QRF · hunt" },
                  { icon: Radio, label: "Comms net", text: "Division net integrated" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-sm border border-border bg-bg/55 px-3 py-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/35 bg-primary/10 text-primary"><item.icon className="h-4 w-4" /></span>
                    <div><p className="stencil text-[9px] tracking-[0.14em] text-primary">{item.label}</p><p className="mt-0.5 text-sm text-fg">{item.text}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-primary/20 pt-4">
                <p className="stencil mb-2.5 text-[9px] tracking-[0.14em] text-subtle">Companies · active</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(managed.companies.length, 1), 6)}, minmax(0,1fr))` }}>
                  {managed.companies.slice(0, 6).map((company) => (
                    <div key={company.callsign} className="flex min-w-0 flex-col items-center gap-1.5 rounded-sm border border-border bg-bg/50 p-1.5 sm:p-2">
                      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-sm border border-border-strong bg-black sm:h-9 sm:w-9"><img src={company.logo} alt="" className="h-full w-full object-contain" /></span>
                      <span className="max-w-full truncate font-mono text-[7px] text-muted sm:text-[8px]">{company.callsign.toUpperCase()}</span>
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

function StatsStrip({ managed }: { managed: SiteAdminConfig }) {
  return (
    <section className="border-b border-border py-10 sm:py-12" aria-label="Unit statistics">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-4 sm:px-6">
        {stats.map((stat, i) => (
          <div key={stat.id} className={`bento-stat reveal stagger-${i + 1} px-5 py-6 sm:px-6`}>
            {stat.id === "bugs" ? <BugsKilledCounter /> : stat.id === "dropships" ? <DropshipCounter /> : stat.id === "troopers" ? <TrooperCounter /> : stat.id === "companies" ? <p className="metric-value text-3xl text-fg sm:text-4xl">{managed.companies.length}</p> : <p className="metric-value text-3xl text-fg sm:text-4xl">{stat.value}</p>}
            <p className="stencil mt-3 text-[11px] tracking-[0.12em] text-muted">{stat.id === "dropships" ? "Total Operations completed" : stat.id === "bugs" ? "Confirm KIA Enemies" : stat.label}</p>
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
        <SectionHeading kicker="Core values" title="How the 1st stands" body="Four pillars drilled from boot through senior command. Non-negotiable under fire." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doctrine.map((item, i) => {
            const Icon = icons[i] ?? Shield;
            return (
              <article key={item.title} className="panel panel-lift p-5">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm border border-primary/45 bg-primary text-black"><Icon className="h-5 w-5" /></span>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-fg sm:text-2xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CompanyMark({ logo, Icon, name }: { logo: string | null; Icon: LucideIcon; name: string }) {
  return logo ? (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong bg-black"><img src={logo} alt={`${name} company logo`} className="h-full w-full object-contain" decoding="async" /></span>
  ) : (
    <span className="icon-bubble h-14 w-14 shrink-0"><Icon className="h-5 w-5" /></span>
  );
}

function CompaniesSection({ managed }: { managed: SiteAdminConfig }) {
  const icons = [Shield, Fuel, Radio, Flame];
  return (
    <section id="companies" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading kicker="Order of battle" title={`The ${managed.companies.length} companies`} body="Each company owns a warfighting mission. Company details and captains are managed directly by leadership." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {managed.companies.map((company, i) => {
            const Icon = icons[i] ?? Shield;
            return (
              <article key={`${company.callsign}-${i}`} className="panel panel-lift flex flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3"><CompanyMark logo={company.logo || null} Icon={Icon} name={company.callsign} /><div><p className="stencil text-[10px] tracking-[0.12em] text-subtle">{company.code} · {company.role}</p><h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{company.callsign}</h2><p className="mt-1 font-mono text-xs text-muted">Capt. {company.captain}</p></div></div>
                  <span className="shrink-0 rounded-sm border border-primary/35 bg-primary/10 px-2.5 py-1 stencil text-[10px] tracking-[0.1em] text-primary">{company.winCon}</span>
                </div>
                {company.logo ? <div className="mt-5 flex justify-center rounded-md border border-border bg-black/60 p-4"><img src={company.logo} alt="" className="h-28 w-28 object-contain sm:h-32 sm:w-32" /></div> : null}
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{company.summary}</p>
                <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">{company.traits.map((trait) => <li key={trait} className="chip">{trait}</li>)}</ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const planetClass: Record<string, string> = { Valaka: "planet-valaka", "Agni Prime": "planet-agni", Boreas: "planet-boreas", "X-11": "planet-x11", Vietnam: "planet-vietnam" };
const vietnamCampaign = { code: "AO-VIETNAM", name: "Vietnam", year: "FY 1968", outcome: "Ongoing", terrain: "Jungle · rivers · FOBs · air mobile", brief: "Dense jungle, muddy patrol routes, river crossings, fortified FOBs, and helicopter mobility define the Vietnam theater. Close-range firefights and coordinated air-mobile operations keep the 1st fighting across a very different battlefield." };
const activeCampaigns = [...campaigns, vietnamCampaign];

function CampaignsSection() {
  return (
    <section id="theaters" className="scroll-mt-24 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading kicker="Active theaters" title="The five theaters" body="Valaka, Agni Prime, Boreas, X-11, and Vietnam. All ongoing." />
        <div className="mt-10 space-y-4">
          {activeCampaigns.map((campaign) => (
            <article key={campaign.code} className={`panel panel-lift planet-rail grid gap-4 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-start sm:gap-6 sm:p-6 ${planetClass[campaign.name] ?? ""}`} style={campaign.name === "Vietnam" ? ({ "--planet-art": 'url("/theater-vietnam.jpg"), linear-gradient(145deg, #122015, #050705)' } as CSSProperties) : undefined}>
              <div><p className="font-mono text-xs text-primary">{campaign.code}</p><p className="mt-1 font-mono text-xs text-subtle">{campaign.year}</p></div>
              <div><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">{campaign.name}</h2><p className="font-mono text-[11px] text-subtle">{campaign.terrain}</p></div><p className="mt-2.5 text-sm leading-relaxed text-muted">{campaign.brief}</p></div>
              <span className="inline-flex h-8 items-center justify-self-start rounded-sm border border-primary/35 bg-primary/10 px-2.5 stencil text-[10px] tracking-[0.1em] text-primary sm:justify-self-end">{campaign.outcome}</span>
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
        <div><p className="section-kicker">Next steps</p><h2 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-fg">Know the chain. Know the rules. Then join.</h2><p className="mt-2 max-w-xl text-muted">Leadership, standing rules, and Join Now! live on their own pages.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link to="/join">Join Now!</Link></Button><Button asChild variant="secondary" size="lg"><Link to="/leadership">Leadership</Link></Button><Button asChild variant="outline" size="lg"><Link to="/rules">Rules</Link></Button></div>
      </div>
    </section>
  );
}
