import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHero, SectionHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { companies, roster, unit } from "@/data/unit";

export const Route = createFileRoute("/leadership")({
  component: LeadershipPage,
  head: () => ({
    meta: [{ title: "Leadership — 1st Mobile Infantry" }],
  }),
});

function LeadershipPage() {
  const command = roster.filter(
    (p) =>
      String(p.tier).toLowerCase() === "command" &&
      String(p.name).toLowerCase() !== "ripper",
  );

  const alphaCaptain = {
    rank: "Captain",
    name: "HooknGaffe",
    billet: "Alpha Company · Fifth Company",
    note: "Commands Alpha Company, the fifth company of the 1st Mobile Infantry.",
    tier: "captain",
    company: "Alpha",
    portrait: "/roster-hookngaffe.svg?v=1",
  } as (typeof roster)[number];

  const captains = [
    ...roster.filter((p) => String(p.tier).toLowerCase() === "captain"),
    alphaCaptain,
  ];

  return (
    <AppShell>
      <PageHero
        kicker="Chain of command"
        title="Leadership"
        body="Division command sets the fight. Company captains own the line. This is who steers the 1st Mobile Infantry."
        meta={`${unit.division} · ${unit.shortName}`}
      />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 panel panel-static p-5 sm:p-6">
          <p className="stencil text-[11px] tracking-[0.14em] text-primary">Command intent</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Leadership in the 1st is not a costume. Officers drop with their people, brief
            clear intent, and take responsibility when the plan breaks. Rank is a duty,
            not a pedestal.
          </p>
        </div>

        <SectionHeading
          kicker="Division HQ"
          title="Division command"
          body="General through warrant — the staff that owns the whole division."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {command.length === 0 ? (
            <p className="text-sm text-muted sm:col-span-2">
              No division command entries found. Check roster tiers in{" "}
              <code className="font-mono text-primary">src/data/unit.ts</code>.
            </p>
          ) : (
            command.map((person) => (
              <OfficerCard key={person.name} person={person} featured />
            ))
          )}
        </div>

        <div className="mt-16">
          <SectionHeading
            kicker="Company command"
            title="Company captains"
            body="Five captains. Five companies. Report up the chain; own the ground under your boots."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {captains.length === 0 ? (
              <p className="text-sm text-muted sm:col-span-2">
                No company captains found. Check roster tiers in{" "}
                <code className="font-mono text-primary">src/data/unit.ts</code>.
              </p>
            ) : (
              captains.map((person) => (
                <OfficerCard key={person.name} person={person} />
              ))
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link to="/">Back to Home</Link>
          </Button>
          <Button asChild>
            <Link to="/rules">Read unit rules</Link>
          </Button>
        </div>
      </section>
    </AppShell>
  );
}

function OfficerCard({
  person,
  featured,
}: {
  person: (typeof roster)[number];
  featured?: boolean;
}) {
  const initials = person.name
    .replace(/[^a-zA-Z]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portrait =
    "portrait" in person && person.portrait ? person.portrait : null;

  const displayedRank = person.name === "Lustrati" ? "Major" : person.rank;
  const isAlpha = "company" in person && person.company === "Alpha";

  const companyLogo =
    "company" in person && person.company
      ? isAlpha
        ? "/company-alpha.png?v=4"
        : companies.find((c) => c.callsign === person.company)?.logo
      : null;

  return (
    <article className={`panel panel-lift p-6 ${featured ? "sm:p-7" : ""}`}>
      <div className="flex items-center gap-3">
        {companyLogo ? (
          <span
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_18%,transparent)] ${
              isAlpha ? "h-16 w-16 bg-black/50 p-1.5" : "h-12 w-12 bg-black"
            }`}
          >
            <img
              src={companyLogo}
              alt={
                "company" in person && person.company
                  ? `${person.company} company logo`
                  : ""
              }
              width={isAlpha ? 64 : 48}
              height={isAlpha ? 64 : 48}
              className="h-full w-full object-contain"
              decoding="async"
            />
          </span>
        ) : portrait ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong bg-black shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]">
            <img
              src={portrait}
              alt={`${displayedRank} ${person.name}`}
              width={56}
              height={56}
              className="h-full w-full object-cover object-top"
              decoding="async"
            />
          </span>
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-display text-sm font-semibold text-primary">
            {initials}
          </span>
        )}
        <div className="min-w-0">
          <p className="stencil text-[10px] tracking-[0.12em] text-primary">{displayedRank}</p>
          <h2 className="truncate font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">
            {person.name}
          </h2>
        </div>
      </div>
      {portrait ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border bg-black/60">
          <img
            src={portrait}
            alt=""
            width={480}
            height={600}
            className="aspect-[4/5] w-full object-cover object-top"
            decoding="async"
          />
        </div>
      ) : null}
      <p className="mt-3 font-mono text-xs text-muted">{person.billet}</p>
      {"company" in person && person.company ? (
        <p className="mt-2 inline-flex rounded-sm border border-primary/30 bg-primary/10 px-2 py-0.5 stencil text-[10px] tracking-[0.1em] text-primary">
          {person.company}
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-muted">{person.note}</p>
    </article>
  );
}
