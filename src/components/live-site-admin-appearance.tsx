import { useEffect } from "react";
import { fetchPublicSiteAdminConfig } from "@/lib/site-admin-config-fn";

function cssUrl(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

export function LiveSiteAdminAppearance() {
  useEffect(() => {
    let cancelled = false;
    void fetchPublicSiteAdminConfig()
      .then((config) => {
        if (cancelled) return;
        const background = cssUrl(config.appearance.backgroundImage || "/site-bg.png");
        document.documentElement.style.setProperty("--site-background-image", background);

        let style = document.getElementById("managed-site-appearance") as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = "managed-site-appearance";
          document.head.appendChild(style);
        }
        style.textContent = `
          .field-texture {
            background-image:
              radial-gradient(ellipse 70% 45% at 12% 0%, color-mix(in oklab, var(--color-primary) 6%, transparent), transparent 55%),
              radial-gradient(ellipse 70% 68% at 50% 42%, transparent 0%, color-mix(in oklab, #000 10%, transparent) 65%, color-mix(in oklab, #000 32%, transparent) 100%),
              linear-gradient(180deg, color-mix(in oklab, #000 24%, transparent) 0%, color-mix(in oklab, #000 18%, transparent) 42%, color-mix(in oklab, #000 32%, transparent) 100%),
              var(--site-background-image) !important;
          }
        `;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
