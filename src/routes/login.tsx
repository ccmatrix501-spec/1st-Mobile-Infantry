import { useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { ensureBootstrapLeadership } from "@/lib/leadership-account-fn";

export const Route = createFileRoute("/login")({
  component: LeadershipLoginPage,
  head: () => ({
    meta: [{ title: "Leadership Sign In — 1st Mobile Infantry" }],
  }),
});

function LeadershipLoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(providerId: string) {
    setError(null);
    setLoadingProvider(providerId);
    try {
      await signIn(providerId, {
        callbackURL: "/leadership-control",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoadingProvider(null);
    }
  }

  async function handleCredentialSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const login = username.trim().toLowerCase();
    if (!login || !password) {
      setError("Enter your username and password.");
      return;
    }

    setCredentialLoading(true);
    try {
      // Ensure the first command account exists without exposing its initial
      // password to the client or storing that password in the public repo.
      const bootstrap = await ensureBootstrapLeadership();
      if (!bootstrap.ready && login === bootstrap.username.toLowerCase()) {
        throw new Error(bootstrap.message ?? "Initial leadership account is not configured.");
      }

      // Local leadership usernames map to private pseudo-email identities used
      // internally by Better Auth. Entering a real email continues to work.
      const email = login.includes("@") ? login : `${login}@1stmid.local`;

      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/leadership-control",
      });

      if (signInError) {
        throw new Error(signInError.message ?? "Invalid username or password.");
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

  const anyLoading = credentialLoading || loadingProvider !== null;

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
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Command authentication</p>
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  Leadership Access
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <SignedOut>
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
                      disabled={anyLoading}
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
                      disabled={anyLoading}
                      placeholder="Enter password"
                      className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 font-mono text-sm text-fg outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={anyLoading}
                  className="w-full justify-center"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {credentialLoading ? "Authenticating..." : "Sign In"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3" aria-hidden>
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
                  or continue with
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {GROK_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.providerId}
                    type="button"
                    size="lg"
                    variant="secondary"
                    disabled={anyLoading}
                    onClick={() => void handleSignIn(provider.providerId)}
                    className="w-full justify-center"
                  >
                    <LogIn className="h-4 w-4" aria-hidden />
                    {loadingProvider === provider.providerId
                      ? `Signing in...`
                      : provider.label}
                  </Button>
                ))}
              </div>

              <p className="mt-5 text-xs leading-relaxed text-subtle">
                Leadership credentials are issued by 1st M.I. command. Public account registration is disabled.
              </p>

              {error ? (
                <p className="mt-4 rounded-md border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
            </SignedOut>

            <SignedIn>
              <div className="space-y-5">
                <div className="rounded-md border border-primary/25 bg-primary/10 p-4">
                  <p className="stencil text-[10px] tracking-[0.14em] text-primary">Authenticated</p>
                  <div className="mt-3 text-fg">
                    <UserButton />
                  </div>
                </div>
                <Button asChild size="lg" className="w-full">
                  <Link to="/leadership-control">Continue to Leadership Control</Link>
                </Button>
              </div>
            </SignedIn>

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
