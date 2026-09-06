import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import { fetchPublicSiteAdminConfig } from "@/lib/site-admin-config-fn";
import { fetchPublicStoreSettings } from "@/lib/store-settings-fn";

const publicNavLinks = [
  { to: "/", label: "Home", exact: true },
  { to: "/companies", label: "Companies" },
  { to: "/events", label: "Events" },
  { to: "/store", label: "Store", requiresStore: true },
  { to: "/leadership", label: "Leadership" },
  { to: "/rules", label: "Rules" },
  { to: "/join", label: "Join now" },
] as const;

const commandLinks = [
  { to: "/leadership-control", label: "Control" },
  { to: "/leadership-store", label: "Store" },
  { to: "/leadership-media", label: "Media" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoImage, setLogoImage] = useState("/mi-emblem.jpg");
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [leadershipSignedIn, setLeadershipSignedIn] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void Promise.all([
      fetchPublicSiteAdminConfig(),
      fetchPublicStoreSettings(),
      fetchLocalLeadershipProfile(),
    ])
      .then(([config, store, leadership]) => {
        setLogoImage(config.appearance.logoImage || "/mi-emblem.jpg");
        setStoreEnabled(store.enabled);
        setLeadershipSignedIn(Boolean(leadership));
      })
      .catch(() => undefined);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(to: string, exact?: boolean) {
    if (exact) return pathname === to;
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  const visibleNavLinks = publicNavLinks.filter(
    (link) => !("requiresStore" in link) || storeEnabled,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open
          ? "border-b border-border/80 glass shadow-[0_12px_36px_color-mix(in_oklab,#000_40%,transparent)]"
          : "border-b border-white/10 bg-black/20 backdrop-blur-[6px]",
      )}
    >
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_35%,transparent),0_0_18px_color-mix(in_oklab,var(--color-primary)_22%,transparent)] transition-transform duration-200 group-hover:scale-[1.03]">
            <img
              src={logoImage}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
              decoding="async"
            />
          </span>
          <span className="min-w-0">
            <span className="stencil block text-[10px] leading-none text-primary">1st Division</span>
            <span className="stencil block truncate text-sm leading-tight text-fg sm:text-base">
              Mobile Infantry
            </span>
          </span>
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex"
          aria-label="Primary"
        >
          {visibleNavLinks.map((link) => {
            const active = isActive(link.to, "exact" in link ? link.exact : false);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "stencil rounded-md px-3 py-2 text-xs tracking-[0.12em] text-fg/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] transition-colors hover:bg-surface-hover hover:text-white",
                  active && "nav-link-active",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button asChild size="sm" className="ml-1.5">
            <Link to="/join">Join Now!</Link>
          </Button>
        </nav>

        <div className="ml-auto hidden items-center gap-1 lg:flex">
          {leadershipSignedIn ? (
            <div className="flex items-center gap-1 rounded-lg border border-primary/20 bg-black/35 p-1 backdrop-blur-md">
              {commandLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "stencil rounded-md px-2.5 py-2 text-[9px] tracking-[0.12em] text-primary/90 transition-colors hover:bg-primary/10 hover:text-primary",
                    isActive(link.to) && "bg-primary/10 text-primary",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : (
            /* Invisible leadership access hotspot; authentication remains the real protection. */
            <Link
              to="/login"
              aria-label="Leadership Sign In"
              title=""
              className="h-9 w-[9.5rem] cursor-default rounded-md opacity-0"
            >
              <span className="sr-only">Leadership Sign In</span>
            </Link>
          )}
        </div>

        <Button
          variant="secondary"
          size="icon"
          className="ml-auto lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <nav className="border-t border-border glass px-4 py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col gap-1">
            {visibleNavLinks.map((link) => {
              const active = isActive(link.to, "exact" in link ? link.exact : false);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={cn(
                      "stencil flex min-h-11 items-center rounded-md px-3 text-sm tracking-[0.12em] text-fg hover:bg-surface-hover",
                      active && "nav-link-active",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}

            {leadershipSignedIn ? (
              <li className="mt-2 border-t border-primary/20 pt-3">
                <p className="px-3 pb-2 stencil text-[9px] tracking-[0.14em] text-primary">Command</p>
                <div className="grid grid-cols-3 gap-2">
                  {commandLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={cn(
                        "stencil flex min-h-10 items-center justify-center rounded-md border border-primary/20 bg-primary/5 px-2 text-[10px] tracking-[0.1em] text-primary",
                        isActive(link.to) && "bg-primary/15",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </li>
            ) : null}

            <li className="pt-2">
              <Button asChild className="w-full">
                <Link to="/join" onClick={() => setOpen(false)}>
                  Join Now!
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
