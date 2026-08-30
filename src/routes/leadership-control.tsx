import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, Save, ShieldCheck } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  fetchLeadershipSiteContent,
  saveSiteContent,
} from "@/lib/site-content-fn";
import {
  mergeSiteContent,
  type SiteContent,
  type SiteContentKey,
} from "@/lib/site-content";

export const Route = createFileRoute("/leadership-control")({
  component: LeadershipControlPage,
  head: () => ({
    meta: [{ title: "Leadership Control — 1st Mobile Infantry" }],
  }),
});

const fields: Array<{
  key: SiteContentKey;
  label: string;
  help: string;
  multiline?: boolean;
}> = [
  { key: "heroTitleLine1", label: "Hero title — line 1", help: "Main homepage heading." },
  { key: "heroTitleLine2", label: "Hero title — line 2", help: "Highlighted second line." },
  { key: "motto", label: "Primary motto", help: "Large green banner text." },
  { key: "secondaryMotto", label: "Secondary motto", help: "Text directly below the primary motto." },
  {
    key: "intro",
    label: "Homepage introduction",
    help: "Main paragraph beneath the mottos.",
    multiline: true,
  },
  { key: "established", label: "Established", help: "Established date / Federal Year." },
  { key: "homebase", label: "Home base", help: "Home-base location shown in the hero." },
  { key: "theaterTitle", label: "Theater section title", help: "Heading above active theaters." },
  {
    key: "theaterBody",
    label: "Theater section description",
    help: "Summary shown above the theater cards.",
    multiline: true,
  },
];

function LeadershipControlPage() {
  const { user, isPending } = useCurrentUserState();
  const [draft, setDraft] = useState<SiteContent>(() => mergeSiteContent());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchLeadershipSiteContent()
      .then((content) => {
        if (!cancelled) setDraft(content);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "You do not have leadership editing access.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isPending) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">Checking leadership session…</div>
      </AppShell>
    );
  }

  if (!user) return <RedirectToSignIn />;

  function updateField(key: SiteContentKey, value: string) {
    setSaved(false);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await saveSiteContent({ data: draft });
      setDraft(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save website changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHero
        kicker="Authenticated command access"
        title="Leadership Control"
        body="Edit public 1st Mobile Infantry website content. Changes save to the live database and appear on the homepage without a GitHub deployment."
        meta="1ST MI DIV · WEBSITE CONTROL"
      />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="panel panel-static p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Signed in</p>
                <UserButton />
              </div>
            </div>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link to="/">
              <Eye className="h-4 w-4" aria-hidden />
              View Public Site
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="panel panel-feature overflow-hidden">
          <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Homepage editor</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Public Content
            </h2>
          </div>

          <div className="grid gap-5 p-5 sm:p-6">
            {loading ? (
              <p className="text-sm text-muted">Loading live website content…</p>
            ) : (
              fields.map((field) => (
                <label key={field.key} className="grid gap-2">
                  <span>
                    <span className="block font-display text-sm font-semibold uppercase tracking-wide text-fg">
                      {field.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{field.help}</span>
                  </span>
                  {field.multiline ? (
                    <textarea
                      value={draft[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      rows={4}
                      className="min-h-28 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                    />
                  ) : (
                    <input
                      value={draft[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                    />
                  )}
                </label>
              ))
            )}

            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Saving updates the live database. No GitHub push is required for these text changes.
              </p>
              <div className="flex items-center gap-3">
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Saved
                  </span>
                ) : null}
                <Button
                  type="button"
                  size="lg"
                  disabled={loading || saving || Boolean(error)}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
