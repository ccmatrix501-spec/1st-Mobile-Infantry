export type StoreSettings = {
  enabled: boolean;
  kicker: string;
  title: string;
  body: string;
  statusText: string;
  heroImage: string;
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  enabled: false,
  kicker: "Quartermaster",
  title: "1st M.I. Store",
  body: "Official 1st Mobile Infantry merchandise, apparel, and community gear.",
  statusText: "Store inventory is being prepared. Check back soon.",
  heroImage: "",
};

export function mergeStoreSettings(input?: Partial<StoreSettings> | null): StoreSettings {
  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(input ?? {}),
    enabled: input?.enabled === true,
  };
}
