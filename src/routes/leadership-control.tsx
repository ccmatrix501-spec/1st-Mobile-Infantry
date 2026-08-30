import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  KeyRound,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  changeLeadershipUsername,
  fetchLeadershipProfile,
  type LeadershipProfile,
} from "@/lib/leadership-account-fn";
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
  const [profile, setProfile] = useState<LeadershipProfile | null>(null);
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
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([fetchLeadershipSiteContent(), fetchLeadershipProfile()])
      .then(([content, leadershipProfile]) => {
        if (cancelled) return;
        setDraft(content);
        setProfile(leadershipProfile);
        setNewUsername(leadershipProfile.username);
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

  async function handleUsernameSave() {
    setAccountSaving(true);
    setAccountMessage(null);
    setError(null);
    try {
      const updated = await changeLeadershipUsername({
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
      const { error: passwordError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (passwordError) {
        throw new Error(passwordError.message ?? "Could not change password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountMessage("Password changed successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setAccountSaving(false);
    }
  }

  const localCredentialAccount = Boolean(profile?.email.endsWith("@1stmid.local"));

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
                {profile ? (
                  <p className="mt-1 font-mono text-[10px] text-subtle">
                    Leadership username: {profile.username}
                    {profile.isSuperAdmin ? " · Super Admin" : ""}
                  </p>
                ) : null}
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

        <div className="mt-6 panel panel-feature overflow-hidden">
          <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Account & security</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Leadership Credentials
            </h2>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
            {localCredentialAccount ? (
              <>
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
                    disabled={accountSaving || !newUsername.trim() || newUsername.trim().toLowerCase() === profile?.username.toLowerCase()}
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
                    Minimum 8 characters. Changing the password revokes other active sessions.
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
              </>
            ) : (
              <div className="lg:col-span-2 rounded-md border border-border bg-black/20 p-4 text-sm text-muted">
                This account uses an external identity provider. Its password is managed by that provider; website editing access remains controlled here.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
