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

          /* Darken the site artwork itself instead of putting panels behind text. */
          .field-texture {
            background-image:
              radial-gradient(
                ellipse 70% 45% at 12% 0%,
                color-mix(in oklab, var(--color-primary) 4%, transparent),
                transparent 55%
              ),
              radial-gradient(
                ellipse 70% 68% at 50% 42%,
                transparent 0%,
                rgba(0, 0, 0, 0.20) 62%,
                rgba(0, 0, 0, 0.50) 100%
              ),
              linear-gradient(
                180deg,
                rgba(0, 0, 0, 0.52) 0%,
                rgba(0, 0, 0, 0.48) 42%,
                rgba(0, 0, 0, 0.60) 100%
              ),
              url("/site-bg.png") !important;
          }

          /* Active theater cards: square image-ready planet tiles. */
          #theaters .mt-10.space-y-4 {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr);
            gap: 1rem;
          }

          #theaters .mt-10.space-y-4 > article {
            position: relative;
            display: flex !important;
            aspect-ratio: 1 / 1;
            min-width: 0;
            flex-direction: column;
            justify-content: flex-end;
            overflow: hidden;
            margin: 0 !important;
            padding: 1.25rem !important;
            isolation: isolate;
            background-image:
              linear-gradient(
                180deg,
                rgba(0, 0, 0, 0.28) 0%,
                rgba(0, 0, 0, 0.18) 36%,
                rgba(0, 0, 0, 0.82) 78%,
                rgba(0, 0, 0, 0.94) 100%
              ),
              var(--planet-art, linear-gradient(145deg, #111811, #070907));
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          #theaters .mt-10.space-y-4 > article > div:first-child {
            position: absolute;
            top: 1.25rem;
            left: 1.25rem;
            z-index: 2;
          }

          #theaters .mt-10.space-y-4 > article > div:nth-child(2) {
            position: relative;
            z-index: 2;
            margin-top: auto;
          }

          #theaters .mt-10.space-y-4 > article > span {
            position: absolute;
            top: 1.25rem;
            right: 1.25rem;
            z-index: 2;
          }

          #theaters .mt-10.space-y-4 > article p.mt-2\\.5 {
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 4;
          }

          /* Image hooks for the planet artwork you upload next. */
          #theaters .planet-valaka { --planet-art: linear-gradient(145deg, #171510, #080807); }
          #theaters .planet-agni { --planet-art: linear-gradient(145deg, #1a100c, #080706); }
          #theaters .planet-boreas { --planet-art: linear-gradient(145deg, #0e171b, #07090a); }
          #theaters .planet-x11 { --planet-art: linear-gradient(145deg, #151515, #070707); }

          @media (min-width: 640px) {
            #theaters .mt-10.space-y-4 {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (min-width: 1024px) {
            #theaters .mt-10.space-y-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            #theaters .mt-10.space-y-4 > article {
              padding: 1rem !important;
            }

            #theaters .mt-10.space-y-4 > article > div:first-child {
              top: 1rem;
              left: 1rem;
            }

            #theaters .mt-10.space-y-4 > article > span {
              top: 1rem;
              right: 1rem;
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
