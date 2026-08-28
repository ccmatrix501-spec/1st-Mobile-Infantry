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

          /* Active theater cards: square planet-image tiles. */
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
                rgba(0, 0, 0, 0.32) 0%,
                rgba(0, 0, 0, 0.24) 32%,
                rgba(0, 0, 0, 0.50) 52%,
                rgba(0, 0, 0, 0.80) 72%,
                rgba(0, 0, 0, 0.96) 100%
              ),
              var(--planet-art, linear-gradient(145deg, #111811, #070907));
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          #theaters .mt-10.space-y-4 > article::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            box-shadow:
              inset 0 0 0 1px rgba(255, 255, 255, 0.08),
              inset 0 -130px 135px rgba(0, 0, 0, 0.30);
          }

          /* Operation code and year get a dedicated contrast plate. */
          #theaters .mt-10.space-y-4 > article > div:first-child {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 3;
            padding: 0.45rem 0.6rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 0.45rem;
            background: rgba(0, 0, 0, 0.68);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 5px 18px rgba(0, 0, 0, 0.42);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 1);
          }

          #theaters .mt-10.space-y-4 > article > div:first-child p:first-child {
            color: #35f27c !important;
            font-weight: 700;
          }

          #theaters .mt-10.space-y-4 > article > div:first-child p:nth-child(2) {
            color: rgba(255, 255, 255, 0.9) !important;
            font-weight: 600;
          }

          /* Main planet copy gets a translucent backing so it never disappears into the art. */
          #theaters .mt-10.space-y-4 > article > div:nth-child(2) {
            position: relative;
            z-index: 3;
            margin: auto -0.5rem -0.5rem;
            padding: 0.8rem 0.8rem 0.9rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 0.65rem;
            background: linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.50) 0%,
              rgba(0, 0, 0, 0.72) 48%,
              rgba(0, 0, 0, 0.84) 100%
            );
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
            text-shadow:
              0 2px 3px rgba(0, 0, 0, 1),
              0 0 10px rgba(0, 0, 0, 0.95);
          }

          #theaters .mt-10.space-y-4 > article > div:nth-child(2) h2 {
            color: #ffffff !important;
            font-weight: 700;
            text-shadow:
              0 2px 3px rgba(0, 0, 0, 1),
              0 0 12px rgba(0, 0, 0, 1);
          }

          #theaters .mt-10.space-y-4 > article > div:nth-child(2) p.font-mono {
            color: rgba(255, 255, 255, 0.9) !important;
            font-weight: 600;
          }

          #theaters .mt-10.space-y-4 > article > span {
            position: absolute;
            top: 1rem;
            right: 1rem;
            z-index: 3;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            background: rgba(0, 0, 0, 0.76) !important;
            border-color: rgba(34, 197, 94, 0.60) !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.62);
            text-shadow: 0 2px 4px rgba(0, 0, 0, 1);
          }

          #theaters .mt-10.space-y-4 > article p.mt-2\\.5 {
            display: -webkit-box;
            overflow: hidden;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 4;
            color: #ffffff !important;
            font-weight: 600;
            line-height: 1.55;
            text-shadow:
              0 2px 3px rgba(0, 0, 0, 1),
              0 0 8px rgba(0, 0, 0, 1);
          }

          #theaters .planet-valaka {
            --planet-art:
              url("/planet-valaka.webp"),
              linear-gradient(145deg, #171510, #080807);
          }

          #theaters .planet-agni {
            --planet-art:
              url("/planet-agni.webp"),
              linear-gradient(145deg, #1a100c, #080706);
          }

          #theaters .planet-boreas {
            --planet-art:
              url("/planet-boreas.webp"),
              linear-gradient(145deg, #0e171b, #07090a);
          }

          #theaters .planet-x11 {
            --planet-art:
              url("/planet-x11.webp"),
              linear-gradient(145deg, #151515, #070707);
          }

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
              top: 0.85rem;
              left: 0.85rem;
            }

            #theaters .mt-10.space-y-4 > article > span {
              top: 0.85rem;
              right: 0.85rem;
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
