import { Link } from "@tanstack/react-router";
import { navLinks, unit } from "@/data/unit";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border bg-bg-elevated">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-primary)_30%,transparent),0_0_20px_color-mix(in_oklab,var(--color-primary)_18%,transparent)]">
            <img
              src="/mi-emblem.jpg"
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover"
              decoding="async"
            />
          </span>
          <div>
            <p className="stencil text-[11px] tracking-[0.14em] text-primary">{unit.branch}</p>
            <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              {unit.designation}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Unofficial fan tribute inspired by Robert A. Heinlein's{" "}
              <em>Starship Troopers</em>. Not affiliated with any studio or publisher.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-subtle">Navigate</p>
            <ul className="mt-3 space-y-2">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <p className="stencil text-[10px] tracking-[0.14em] text-subtle">Standing order</p>
            <p className="mt-3 font-mono text-xs text-muted">{unit.tagline}</p>
            <p className="mt-2 text-sm text-muted">{unit.motto}</p>
            <Link
              to="/"
              className="mt-4 inline-block stencil text-[11px] tracking-[0.12em] text-muted transition-colors hover:text-primary"
            >
              Return to home
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
