import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, MessageCircle } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { enlistSteps, unit } from "@/data/unit";

export const Route = createFileRoute("/join")({
  component: JoinPage,
  head: () => ({
    meta: [{ title: "Join Now! — 1st Mobile Infantry" }],
  }),
});

function JoinPage() {
  return (
    <AppShell>
      <PageHero
        kicker="Recruiting"
        title="Join Now!"
        body="The front gate is Discord. Join the 1st M.I. server, read the rules, and get on the line with your company."
        meta={unit.discordLabel}
      />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <blockquote className="panel panel-static p-6">
            <p className="font-display text-xl font-semibold uppercase leading-snug tracking-wide text-fg sm:text-2xl">
              &ldquo;Come on, you apes! You wanna live forever?&rdquo;
            </p>
            <footer className="mt-3 stencil text-[11px] tracking-[0.12em] text-muted">
              — Unit battle cry · attributed
            </footer>
          </blockquote>
          <ol className="mt-8 space-y-4">
            {enlistSteps.map((step) => (
              <li key={step.step} className="panel p-5">
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">
                  Stage {step.step}
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/rules">Read the rules first</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/leadership">Meet leadership</Link>
            </Button>
          </div>
        </div>

        <div className="panel panel-feature panel-static overflow-hidden">
          <div className="border-b border-border px-6 py-5 sm:px-8">
            <p className="stencil text-[11px] tracking-[0.14em] text-primary">Official channel</p>
            <p className="mt-1 font-display text-lg font-semibold uppercase tracking-wide text-fg">
              Join via Discord
            </p>
          </div>
          <div className="space-y-6 bg-bg/40 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="icon-bubble flex h-14 w-14 shrink-0 items-center justify-center">
                <MessageCircle className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  {unit.discordLabel}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  New troopers report in on Discord. Company channels, ops, certifications,
                  and leadership all live there. One click opens the invite.
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="w-full sm:w-auto">
              <a
                href={unit.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Now! — Discord
                <ExternalLink aria-hidden />
              </a>
            </Button>

            <p className="break-all font-mono text-xs text-subtle">{unit.discordInvite}</p>

            <div className="rounded-md border border-border bg-surface/60 p-4">
              <p className="stencil text-[10px] tracking-[0.12em] text-primary">Before you drop</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                <li>· Read Server Rules & Standing Orders on this site</li>
                <li>· Enable DMs so leadership can reach you</li>
                <li>· Respect rank tags and company channels</li>
              </ul>
            </div>

            <Button asChild variant="secondary" className="w-full sm:w-auto">
              <Link to="/rules">Open rules</Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
