import { useEffect, useState } from "react";
import {
  DEFAULT_SITE_ADMIN_CONFIG,
  type SiteAdminConfig,
} from "@/lib/site-admin-config";
import { fetchPublicSiteAdminConfig } from "@/lib/site-admin-config-fn";

export function useSiteAdminConfig(): SiteAdminConfig {
  const [config, setConfig] = useState<SiteAdminConfig>(DEFAULT_SITE_ADMIN_CONFIG);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicSiteAdminConfig()
      .then((next) => {
        if (!cancelled) setConfig(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
