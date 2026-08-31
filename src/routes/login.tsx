import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchLocalLeadershipProfile,
  loginLeadership,
} from "@/lib/leadership-local-auth-fn";

export const Route = createFileRoute("/login")({
  component: LeadershipLoginPage,
  head: () => ({
    meta: [{ title: "Leadership Sign In — 1st Mobile Infantry" }],
  }),
});

function LeadershipLoginPage() {
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [signedInUsername, setSignedInUsername] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLocalLeadershipProfile()
      .then((profile) => {
        if (cancelled || !profile) return;
        setSignedIn(true);
        setSignedInUsername(profile.username);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCredentialSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const login = username.trim();
    if (!login || !password) {
      setError("Enter your username and password.");
      return;
    }

    setCredentialLoading(true);
    try {
      const result = await loginLeadership({
        data: { username: login, password },
      });
      if (!result.ok) {
        throw new Error(result.error ?? "Invalid username or password.");
      }
      window.location.href = "/leadership-control";
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Invalid username or password.",
      );
      setCredentialLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHero
        kicker="Restricted access"
        title="Leadership Sign In"
        body="Sign in to your 1st Mobile Infantry leadership account."
        meta="1ST MI DIV · LEADERSHIP ACCESS"
      />

      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="panel panel-feature overflow-hidden">
          <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/35 bg-black/40 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">
                  Command authentication
                </p>
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  Leadership Access
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {checkingSession ? (
              <p className="text-sm text-muted">Checking leadership session…</p>
            ) : signedIn ? (
              <div className="space-y-5">
                <div className="rounded-md border border-primary/25 bg-primary/10 p-4">
                  <p className="stencil text-[10px] tracking-[0.14em] text-primary">
                    Authenticated
                  </p>
                  <p className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-fg">
                    {signedInUsername}
                  </p>
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link to="/leadership-control">Continue to Leadership Control</Link>
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleCredentialSignIn} className="space-y-4">
                  <div>
                    <label
                      htmlFor="leadership-username"
                      className="stencil mb-2 block text-[10px] tracking-[0.12em] text-primary"
                    >
                      Username
                    </label>
                    <div className="relative">
                      <UserRound
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                        aria-hidden
                      />
                      <input
                        id="leadership-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        disabled={credentialLoading}
                        placeholder="Enter leadership username"
                        className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 font-mono text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="leadership-password"
                      className="stencil mb-2 block text-[10px] tracking-[0.12em] text-primary"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                        aria-hidden
                      />
                      <input
                        id="leadership-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={credentialLoading}
                        placeholder="Enter password"
                        className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 font-mono text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={credentialLoading}
                    className="w-full justify-center"
                  >
                    <LogIn className="h-4 w-4" aria-hidden />
                    {credentialLoading ? "Authenticating..." : "Sign In"}
                  </Button>
                </form>

                <p className="mt-5 text-xs leading-relaxed text-subtle">
                  Leadership credentials are issued by 1st M.I. command. Public account registration is disabled.
                </p>

                {error ? (
                  <p className="mt-4 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </p>
                ) : null}
              </>
            )}

            <div className="mt-6 border-t border-border pt-5 text-center">
              <Link
                to="/"
                className="font-mono text-xs text-muted transition-colors hover:text-primary"
              >
                Return to public website
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
