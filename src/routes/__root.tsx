import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "1st Mobile Infantry — Federal Armed Services" },
      {
        name: "description",
        content:
          "1st Mobile Infantry, 1st Division. Doctrine, companies, theaters, roster, and enlist.",
      },
      { property: "og:title", content: "1st Mobile Infantry" },
      {
        property: "og:description",
        content: "No one stacks them high like the First M.I.",
      },
      { property: "og:image", content: "/mi-emblem.jpg" },
      { name: "theme-color", content: "#050705" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/mi-emblem.jpg", type: "image/jpeg" },
      { rel: "apple-touch-icon", href: "/mi-emblem.jpg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <style>{`
          /* Keep the large homepage company / Order of Battle section removed. */
          #companies {
            display: none !important;
          }

          /* Homepage readability layer: darken only behind the hero copy. */
          section:has(.hero-title)::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(
              90deg,
              rgba(0, 0, 0, 0.68) 0%,
              rgba(0, 0, 0, 0.5) 36%,
              rgba(0, 0, 0, 0.2) 62%,
              rgba(0, 0, 0, 0) 100%
            );
          }

          section:has(.hero-title) > div.relative {
            position: relative;
            z-index: 1;
          }

          section:has(.hero-title) div.reveal:has(.hero-title) {
            padding: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            background: rgba(0, 0, 0, 0.3);
            box-shadow: 0 12px 42px rgba(0, 0, 0, 0.38);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
          }

          .hero-title {
            text-shadow: 0 3px 14px rgba(0, 0, 0, 0.95);
          }

          section:has(.hero-title) div.reveal:has(.hero-title) > p:nth-of-type(3),
          section:has(.hero-title) div.reveal:has(.hero-title) > p:nth-of-type(4) {
            color: rgba(244, 246, 243, 0.96) !important;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.95);
          }

          section:has(.hero-title) div.reveal:has(.hero-title) > p:nth-of-type(4) {
            font-weight: 500;
          }

          section:has(.hero-title) div.reveal:has(.hero-title) dt {
            color: rgba(244, 246, 243, 0.78) !important;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
          }

          section:has(.hero-title) div.reveal:has(.hero-title) dd {
            font-weight: 500;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
          }

          section[aria-label="Unit statistics"] .stencil {
            color: rgba(244, 246, 243, 0.82) !important;
          }

          @media (max-width: 640px) {
            section:has(.hero-title) div.reveal:has(.hero-title) {
              padding: 1rem;
            }
          }
        `}</style>
      </head>
      <body className="field-texture antialiased">
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
