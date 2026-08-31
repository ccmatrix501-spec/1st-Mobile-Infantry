import { createFileRoute, Link } from "@tanstack/react-router";
import { Crosshair, Shield, UserRound } from "lucide-react";
import { AppShell, PageHero, SectionHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useSiteAdminConfig } from "@/lib/use-site-admin-config";

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
  head: () => ({
    meta: [{ title: "Companies — 1st Mobile Infantry" }],
  }),
});

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function CompaniesPage() {
  const managed = useSiteAdminConfig();
  const companies = managed.companies;

  return (
    <AppShell>
      <PageHero
        kicker="Order of battle"
        title="The Companies"
        body="Every company in the 1st Mobile Infantry owns a distinct battlefield role. Meet the units, their captains, their mission sets, and the capabilities they bring to the line."
        meta={`${companies.length} ACTIVE COMPANIES · 1ST MI DIV`}
      />

      <section className="border-b border-border bg-bg-elevated/40">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="stencil text-[10px] tracking-[0.14em] text-subtle">Company directory</p>
          <nav className="mt-3 flex flex-wrap gap-2" aria-label="Company directory">
            {companies.map((company) => (
              <a
                key={company.callsign}
                href={`#company-${slug(company.callsign)}`}
                className="rounded-md border border-border-strong bg-black/35 px-3 py-2 font-display text-sm font-semibold uppercase tracking-wide text-muted transition-colors hover:border-primary/45 hover:text-primary"
              >
                {company.callsign}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionHeading
          kicker="Company mission profiles"
          title={`${companies.length} companies. One division.`}
          body="Each company has its own specialty, but all companies operate under the same division command and reinforce one another when the fight demands it."
        />

        <div className="mt-10 space-y-6">
          {companies.map((company, index) => {
            const captain = managed.leadership.find(
              (person) =>
                person.tier === "captain" &&
                (person.company?.toLowerCase() === company.callsign.toLowerCase() ||
                  person.name.toLowerCase() === company.captain.toLowerCase()),
            );

            return (
              <article
                key={`${company.callsign}-${index}`}
                id={`company-${slug(company.callsign)}`}
                className="panel panel-feature scroll-mt-24 overflow-hidden"
              >
                <div className="grid lg:grid-cols-[260px_1fr]">
                  <div className="relative flex min-h-64 items-center justify-center border-b border-border bg-black/55 p-8 lg:min-h-full lg:border-b-0 lg:border-r">
                    <div
                      className="pointer-events-none absolute inset-0 opacity-50"
                      aria-hidden
                      style={{
                        background:
                          "radial-gradient(circle at 50% 40%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 62%)",
                      }}
                    />
                    <div className="relative flex flex-col items-center text-center">
                      {company.logo ? (
                        <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-black/70 p-3 shadow-[0_0_35px_color-mix(in_oklab,var(--color-primary)_15%,transparent)]">
                          <img
                            src={company.logo}
                            alt={`${company.callsign} Company logo`}
                            width={144}
                            height={144}
                            className="h-full w-full object-contain"
                            decoding="async"
                          />
                        </div>
                      ) : (
                        <div className="icon-bubble h-32 w-32">
                          <Shield className="h-12 w-12" aria-hidden />
                        </div>
                      )}
                      <p className="mt-5 stencil text-[10px] tracking-[0.14em] text-primary">
                        {company.code}
                      </p>
                      <h2 className="mt-1 font-display text-3xl font-bold uppercase tracking-wide text-fg">
                        {company.callsign}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-muted">Company</p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7 lg:p-8">
                    <div className="flex flex-col gap-5 border-b border-border pb-6 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <p className="section-kicker">Mission role</p>
                        <h3 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-fg sm:text-3xl">
                          {company.role}
                        </h3>
                        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
                          {company.summary}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 xl:max-w-[240px]">
                        <p className="stencil text-[9px] tracking-[0.14em] text-primary">Primary objective</p>
                        <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide text-fg">
                          {company.winCon}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.75fr)]">
                      <div>
                        <div className="flex items-center gap-2">
                          <Crosshair className="h-4 w-4 text-primary" aria-hidden />
                          <p className="stencil text-[10px] tracking-[0.14em] text-primary">Capabilities</p>
                        </div>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {company.traits.length > 0 ? (
                            company.traits.map((trait) => (
                              <li key={trait} className="chip">
                                {trait}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted">No capability tags assigned.</li>
                          )}
                        </ul>
                      </div>

                      <div className="rounded-md border border-border bg-black/25 p-4">
                        <div className="flex items-center gap-3">
                          {captain?.portrait ? (
                            <span className="flex h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border-strong bg-black">
                              <img
                                src={captain.portrait}
                                alt={`${captain.rank} ${captain.name}`}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover object-top"
                                decoding="async"
                              />
                            </span>
                          ) : (
                            <span className="icon-bubble h-14 w-14 shrink-0">
                              <UserRound className="h-5 w-5" aria-hidden />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="stencil text-[9px] tracking-[0.14em] text-primary">Company command</p>
                            <p className="mt-1 truncate font-display text-xl font-semibold uppercase tracking-wide text-fg">
                              {captain?.name || company.captain}
                            </p>
                            <p className="font-mono text-[11px] text-muted">
                              {captain?.rank || "Captain"}
                            </p>
                          </div>
                        </div>
                        {captain?.note ? (
                          <p className="mt-3 text-xs leading-relaxed text-muted">{captain.note}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 panel panel-static flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="section-kicker">Next step</p>
            <h2 className="mt-2 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Find your place on the line
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Review the chain of command, read the standing orders, then report through Discord to begin onboarding.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary">
              <Link to="/leadership">Leadership</Link>
            </Button>
            <Button asChild>
              <Link to="/join">Join Now!</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
