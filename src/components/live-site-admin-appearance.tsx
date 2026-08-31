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
        document.documentElement.style.setProperty(
          "--site-background-image",
          cssUrl(config.appearance.backgroundImage || "/site-bg.png"),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
