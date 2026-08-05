import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHero, SectionHeading } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { serverRules, standingOrders, unit } from "@/data/unit";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
  head: () => ({
    meta: [{ title: "Rules & Standing Orders — 1st Mobile Infantry" }],
  }),
});

function RulesPage() {
  return (
    <AppShell>
      <PageHero
        kicker="Regulations"
        title="Rules & Standing Orders"
        body="Server rules apply to all channels. Standing Orders cover operations, discipline, LOA, certifications, and company life in the 1st M.I."
        meta={`${unit.designation} · Official document`}
      />

      {/* Jump links */}
      <div className="border-b border-border bg-bg-elevated/50">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-4 sm:px-6">
          <a
            href="#server-rules"
            className="rounded-md border border-border bg-surface px-3 py-2 stencil text-[11px] tracking-[0.1em] text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            Server Rules
          </a>
          <a
            href="#standing-orders"
            className="rounded-md border border-border bg-surface px-3 py-2 stencil text-[11px] tracking-[0.1em] text-muted transition-colors hover:border-primary/40 hover:text-primary"
          >
            Standing Orders
          </a>
        </div>
      </div>

      {/* Server Rules */}
      <section id="server-rules" className="scroll-mt-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            kicker="Discord"
            title="Server Rules"
            body={serverRules.intro}
          />
          <ol className="mt-10 space-y-3">
            {serverRules.items.map((rule) => (
              <li
                key={rule.code}
                className="panel panel-lift grid gap-3 p-5 sm:grid-cols-[72px_1fr] sm:items-start sm:gap-5 sm:p-6"
              >
                <span className="font-display text-2xl font-semibold text-primary">
                  {rule.code}
                </span>
                <p className="text-sm leading-relaxed text-muted sm:pt-1">{rule.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 panel panel-static space-y-3 p-5 sm:p-6">
            <p className="stencil text-[11px] tracking-[0.12em] text-primary">Notes</p>
            <ul className="space-y-2">
              {serverRules.notes.map((note) => (
                <li key={note} className="flex gap-3 text-sm text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Standing Orders */}
      <section id="standing-orders" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            kicker="Operations & community"
            title="Standing Orders"
            body="1–13. Companies, communications, behaviour, discipline, LOA, certifications, lobbies, canisters, structure changes, and voice."
          />
          <ol className="mt-10 space-y-4">
            {standingOrders.map((order) => (
              <li key={order.number} className="panel panel-lift overflow-hidden">
                <div className="border-b border-border bg-bg/40 px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-sm text-primary">
                      {order.number})
                    </span>
                    <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-fg sm:text-2xl">
                      {order.title}
                    </h3>
                  </div>
                  {order.body ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{order.body}</p>
                  ) : null}
                </div>
                {order.subsections.length > 0 ? (
                  <ul className="space-y-3 px-5 py-5 sm:px-6">
                    {order.subsections.map((sub) => (
                      <li key={sub.label} className="grid gap-1 sm:grid-cols-[4.5rem_1fr] sm:gap-3">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {sub.label})
                        </span>
                        <p className="text-sm leading-relaxed text-muted">{sub.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {order.extra && order.extra.length > 0 ? (
                  <div className="space-y-2 border-t border-border bg-bg/30 px-5 py-4 sm:px-6">
                    {order.extra.map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-muted">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="mt-12 panel panel-feature panel-static p-6 sm:p-8">
            <p className="stencil text-[11px] tracking-[0.14em] text-primary">Acknowledgement</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Membership in the 1st M.I. means you have read the Server Rules and Standing
              Orders and will follow them. Ignorance is not a defence.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/join">Join now</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/">Return to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
