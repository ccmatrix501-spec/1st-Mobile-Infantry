export const SITE_CONTENT_DEFAULTS = {
  heroTitleLine1: "1st Mobile",
  heroTitleLine2: "Infantry",
  motto: "No one stacks them high like the First M.I.",
  secondaryMotto: "The First to Drop. The Last to Leave.",
  intro:
    "Five companies. Five active theaters. Demon holds the ARC, Cerberus answers the call, Nightmare fuels the war, Hellfire hunts the enemy, and Alpha drives the fifth line. Service Guarantees Citizenship.",
  established: "Federal Year 2148",
  homebase: "San Diego Recruit Depot · Terra",
  theaterTitle: "The five theaters",
  theaterBody: "Valaka, Agni Prime, Boreas, X-11, and Vietnam. All ongoing.",
} as const;

export type SiteContentKey = keyof typeof SITE_CONTENT_DEFAULTS;
export type SiteContent = Record<SiteContentKey, string>;

export const SITE_CONTENT_KEYS = Object.keys(
  SITE_CONTENT_DEFAULTS,
) as SiteContentKey[];

export function mergeSiteContent(
  values?: Partial<Record<SiteContentKey, string>> | null,
): SiteContent {
  return {
    ...SITE_CONTENT_DEFAULTS,
    ...(values ?? {}),
  };
}
