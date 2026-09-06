import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_STORE_SETTINGS,
  mergeStoreSettings,
  type StoreSettings,
} from "@/lib/store-settings";

type StoreRow = { config: StoreSettings | string };

async function readStoredSettings(): Promise<StoreSettings> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<StoreRow>(
    "select config from store_settings where id = 'main' limit 1",
  );
  const raw = rows[0]?.config;
  if (!raw) return mergeStoreSettings();
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as StoreSettings) : raw;
  return mergeStoreSettings(parsed);
}

async function ensureStoreSettingsTable() {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  await sql.query(`
    create table if not exists store_settings (
      id text primary key,
      config jsonb not null,
      updated_at timestamptz not null default now(),
      updated_by text
    )
  `);
  return sql;
}

function validImageUrl(value: string): boolean {
  if (!value) return true;
  return value.startsWith("/") || /^https:\/\//i.test(value);
}

function validBuyUrl(value: string): boolean {
  if (!value) return true;
  return /^https:\/\//i.test(value);
}

function validateSettings(input: StoreSettings): StoreSettings {
  const settings = mergeStoreSettings(input);
  const json = JSON.stringify(settings);
  if (json.length > 2_000_000) {
    throw new Error("Store configuration is too large. Keep images in the Media Library instead of embedding them.");
  }
  if (settings.title.length > 160 || settings.kicker.length > 80) {
    throw new Error("Store title or kicker is too long.");
  }
  if (settings.body.length > 4_000 || settings.statusText.length > 2_000) {
    throw new Error("Store page text is too long.");
  }
  if (settings.cartNotice.length > 2_000 || settings.checkoutNotice.length > 2_000) {
    throw new Error("Cart or checkout notice is too long.");
  }
  if (!validImageUrl(settings.heroImage)) {
    throw new Error("Store hero image must use a site path or HTTPS URL.");
  }
  if (!/^[A-Z]{3,8}$/.test(settings.defaultCurrency)) {
    throw new Error("Default currency must use a valid currency code such as AUD.");
  }
  if (!Array.isArray(settings.products) || settings.products.length > 250) {
    throw new Error("Store can contain up to 250 products.");
  }
  if (!Array.isArray(settings.categories) || settings.categories.length > 50) {
    throw new Error("Store can contain up to 50 categories.");
  }
  if (!Array.isArray(settings.shippingZones) || settings.shippingZones.length > 50) {
    throw new Error("Store can contain up to 50 shipping zones.");
  }

  const seenProducts = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const product of settings.products) {
    if (!product.id || seenProducts.has(product.id)) throw new Error("Each product must have a unique id.");
    seenProducts.add(product.id);
    if (!product.slug || seenSlugs.has(product.slug)) throw new Error("Each product must have a unique URL slug.");
    seenSlugs.add(product.slug);
    if (!product.name.trim() || product.name.length > 180) throw new Error("Each product needs a valid name.");
    if (product.description.length > 8_000) throw new Error(`Description is too long for ${product.name}.`);
    if (product.price.length > 40 || product.compareAtPrice.length > 40 || product.currency.length > 8) {
      throw new Error(`Price is invalid for ${product.name}.`);
    }
    if (product.category.length > 100 || product.stockStatus.length > 120) {
      throw new Error(`Category or stock status is too long for ${product.name}.`);
    }
    if (!validImageUrl(product.image)) throw new Error(`Image URL is invalid for ${product.name}.`);
    if (!validBuyUrl(product.buyUrl)) throw new Error(`Purchase link for ${product.name} must use HTTPS.`);
    if (product.images.length > 12) throw new Error(`${product.name} can have up to 12 images.`);
    for (const image of product.images) {
      if (!validImageUrl(image.url)) throw new Error(`One of the images for ${product.name} is invalid.`);
    }
    if (product.variants.length > 100) throw new Error(`${product.name} can have up to 100 variants.`);
    const variantIds = new Set<string>();
    for (const variant of product.variants) {
      if (!variant.id || variantIds.has(variant.id)) throw new Error(`Each variant for ${product.name} needs a unique id.`);
      variantIds.add(variant.id);
      if (variant.name.length > 160 || variant.sku.length > 100 || variant.price.length > 40) {
        throw new Error(`Variant details are too long for ${product.name}.`);
      }
      if (variant.options.length > 8) throw new Error(`A variant for ${product.name} has too many options.`);
    }
  }

  const categoryIds = new Set<string>();
  for (const category of settings.categories) {
    if (!category.id || categoryIds.has(category.id)) throw new Error("Each category needs a unique id.");
    categoryIds.add(category.id);
    if (!category.name.trim() || category.name.length > 120 || category.description.length > 2_000) {
      throw new Error("Store category details are invalid.");
    }
  }

  const zoneIds = new Set<string>();
  for (const zone of settings.shippingZones) {
    if (!zone.id || zoneIds.has(zone.id)) throw new Error("Each shipping zone needs a unique id.");
    zoneIds.add(zone.id);
    if (!zone.name.trim() || zone.name.length > 120 || zone.rate.length > 40 || zone.freeOver.length > 40) {
      throw new Error("Shipping zone details are invalid.");
    }
    if (zone.countries.length > 250) throw new Error(`Shipping zone ${zone.name} contains too many country codes.`);
  }

  return settings;
}

export const fetchPublicStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    try {
      const settings = await readStoredSettings();
      return settings.enabled ? settings : { ...DEFAULT_STORE_SETTINGS };
    } catch {
      return mergeStoreSettings();
    }
  },
);

export const fetchLeadershipStoreSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreSettings> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    try {
      return await readStoredSettings();
    } catch {
      return mergeStoreSettings();
    }
  },
);

export const saveLeadershipStoreSettings = createServerFn({ method: "POST" })
  .inputValidator((input: StoreSettings) => input)
  .handler(async ({ data }): Promise<StoreSettings> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const profile = await requireLocalLeadership();
    const settings = validateSettings(data);
    const sql = await ensureStoreSettingsTable();

    await sql.query(
      `insert into store_settings (id, config, updated_at, updated_by)
       values ('main', $1::jsonb, now(), $2)
       on conflict (id) do update
       set config = excluded.config,
           updated_at = excluded.updated_at,
           updated_by = excluded.updated_by`,
      [JSON.stringify(settings), profile.id],
    );

    return settings;
  });

export type StorePageAccess = {
  visible: boolean;
  leadershipPreview: boolean;
  settings: StoreSettings;
};

export const fetchStorePageAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<StorePageAccess> => {
    let settings = mergeStoreSettings();
    try {
      settings = await readStoredSettings();
    } catch {
      // First run / migration timing: hidden Store is the safe default.
    }

    if (settings.enabled) {
      return { visible: true, leadershipPreview: false, settings };
    }

    try {
      const { getLocalLeadershipProfile } = await import("@/lib/local-leadership-access.server");
      const profile = await getLocalLeadershipProfile();
      if (profile) {
        return { visible: true, leadershipPreview: true, settings };
      }
    } catch {
      // Public visitors should not learn private Store configuration.
    }

    return {
      visible: false,
      leadershipPreview: false,
      settings: { ...DEFAULT_STORE_SETTINGS },
    };
  },
);
