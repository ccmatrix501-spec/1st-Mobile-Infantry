import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  KeyRound,
  LogOut,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  changeLocalLeadershipPassword,
  changeLocalLeadershipUsername,
  fetchLocalLeadershipProfile,
  logoutLeadership,
  type LeadershipLocalProfile,
} from "@/lib/leadership-local-auth-fn";
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
  const [draft, setDraft] = useState<SiteContent>(() => mergeSiteContent());
  const [profile, setProfile] = useState<LeadershipLocalProfile | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchLocalLeadershipProfile(),
      fetchLeadershipSiteContent(),
    ])
      .then(([leadershipProfile, content]) => {
        if (cancelled) return;
        if (!leadershipProfile) {
          window.location.href = "/login";
          return;
        }
        setProfile(leadershipProfile);
        setNewUsername(leadershipProfile.username);
        setDraft(content);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Your leadership session has expired. Sign in again.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      setError(err instanceof Error ? err.message : "Could not save website changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUsernameSave() {
    setAccountSaving(true);
    setAccountMessage(null);
    setError(null);
    try {
      const updated = await changeLocalLeadershipUsername({
        data: { username: newUsername },
      });
      setProfile(updated);
      setNewUsername(updated.username);
      setAccountMessage(`Username changed to ${updated.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change username.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handlePasswordSave() {
    setAccountMessage(null);
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Enter your current password and the new password twice.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password confirmation does not match.");
      return;
    }

    setAccountSaving(true);
    try {
      await changeLocalLeadershipPassword({
        data: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountMessage("Password changed successfully. Other old sessions are now invalid.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await logoutLeadership();
    } finally {
      window.location.href = "/login";
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-20 text-center text-muted">
          Checking leadership session…
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <PageHero
          kicker="Restricted access"
          title="Leadership Session Required"
          body="Your leadership session is not active. Sign in again to continue."
          meta="1ST MI DIV · WEBSITE CONTROL"
        />
        <section className="mx-auto max-w-xl px-4 py-12 text-center sm:px-6">
          {error ? (
            <div className="mb-5 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          <Button asChild size="lg">
            <Link to="/login">Return to Leadership Sign In</Link>
          </Button>
        </section>
      </AppShell>
    );
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
                <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                  {profile.username}
                </p>
                <p className="mt-1 font-mono text-[10px] text-subtle">
                  Leadership account{profile.isSuperAdmin ? " · Super Admin" : ""}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="secondary" size="lg">
              <Link to="/">
                <Eye className="h-4 w-4" aria-hidden />
                View Public Site
              </Link>
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" aria-hidden />
              Sign Out
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {accountMessage ? (
          <div className="mb-6 rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {accountMessage}
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
            {fields.map((field) => (
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
            ))}

            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Saving updates the live Neon database. No GitHub push is required for these text changes.
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
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 panel panel-feature overflow-hidden">
          <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Account & security</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Leadership Credentials
            </h2>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
            <div className="rounded-md border border-border bg-black/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                  Change Username
                </h3>
              </div>
              <label className="grid gap-2">
                <span className="stencil text-[10px] tracking-[0.12em] text-primary">
                  Username
                </span>
                <input
                  value={newUsername}
                  onChange={(event) => setNewUsername(event.target.value)}
                  autoComplete="username"
                  className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 font-mono text-sm text-fg outline-none transition-colors focus:border-primary/70"
                />
              </label>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                3–32 characters. Letters, numbers, dots, underscores and hyphens only. Use the new username next time you sign in.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full"
                disabled={
                  accountSaving ||
                  !newUsername.trim() ||
                  newUsername.trim().toLowerCase() === profile.username.toLowerCase()
                }
                onClick={() => void handleUsernameSave()}
              >
                Save Username
              </Button>
            </div>

            <div className="rounded-md border border-border bg-black/20 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                  Change Password
                </h3>
              </div>
              <div className="grid gap-3">
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Minimum 8 characters. Changing the password invalidates older leadership sessions.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full"
                disabled={accountSaving}
                onClick={() => void handlePasswordSave()}
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
