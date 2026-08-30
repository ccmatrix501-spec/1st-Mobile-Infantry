import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";

export const Route = createFileRoute("/login")({
  component: LeadershipLoginPage,
  head: () => ({
    meta: [{ title: "Leadership Sign In — 1st Mobile Infantry" }],
  }),
});

function LeadershipLoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(providerId: string) {
    setError(null);
    setLoadingProvider(providerId);
    try {
      await signIn(providerId, {
        callbackURL: "/leadership",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoadingProvider(null);
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
                <p className="stencil text-[10px] tracking-[0.14em] text-primary">Command authentication</p>
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  Leadership Access
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <SignedOut>
              <p className="text-sm leading-relaxed text-muted">
                Use an approved identity provider to sign in. Access can be restricted further by leadership permissions as the command portal is expanded.
              </p>

              <div className="mt-6 grid gap-3">
                {GROK_PROVIDERS.map((provider) => (
                  <Button
                    key={provider.providerId}
                    type="button"
                    size="lg"
                    variant="secondary"
                    disabled={loadingProvider !== null}
                    onClick={() => void handleSignIn(provider.providerId)}
                    className="w-full justify-center"
                  >
                    <LogIn className="h-4 w-4" aria-hidden />
                    {loadingProvider === provider.providerId
                      ? `Signing in with ${provider.label}...`
                      : `Sign in with ${provider.label}`}
                  </Button>
                ))}
              </div>

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
                  <Link to="/leadership">Continue to Leadership</Link>
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
