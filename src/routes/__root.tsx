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
        <style>{`#companies { display: none !important; }`}</style>
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
