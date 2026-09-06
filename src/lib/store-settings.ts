export type StoreProductStatus = "draft" | "published" | "hidden" | "archived";

export type StoreProductImage = {
  id: string;
  url: string;
  alt: string;
};

export type StoreVariantOption = {
  name: string;
  value: string;
};

export type StoreProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: number;
  active: boolean;
  options: StoreVariantOption[];
};

export type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  visible: boolean;
};

export type StoreShippingZone = {
  id: string;
  name: string;
  countries: string[];
  rate: string;
  freeOver: string;
  enabled: boolean;
};

export type StoreProduct = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  category: string;
  image: string;
  images: StoreProductImage[];
  stockStatus: string;
  stockQuantity: number;
  trackStock: boolean;
  weightGrams: number;
  buyUrl: string;
  visible: boolean;
  featured: boolean;
  status: StoreProductStatus;
  variants: StoreProductVariant[];
  tags: string[];
};

export type StoreSettings = {
  enabled: boolean;
  kicker: string;
  title: string;
  body: string;
  statusText: string;
  heroImage: string;
  defaultCurrency: string;
  cartNotice: string;
  checkoutNotice: string;
  products: StoreProduct[];
  categories: StoreCategory[];
  shippingZones: StoreShippingZone[];
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  enabled: false,
  kicker: "Quartermaster",
  title: "1st M.I. Store",
  body: "Official 1st Mobile Infantry merchandise, apparel, and community gear.",
  statusText: "Store inventory is being prepared. Check back soon.",
  heroImage: "",
  defaultCurrency: "AUD",
  cartNotice: "Payment processing is not connected yet. You can build and preview your cart, but checkout remains locked until command activates payments.",
  checkoutNotice: "Checkout is being prepared. No payment or order can be submitted yet.",
  products: [],
  categories: [
    { id: "apparel", name: "Apparel", slug: "apparel", description: "Shirts, hoodies and wearable 1st M.I. gear.", visible: true },
    { id: "patches", name: "Patches", slug: "patches", description: "Division, company and unit patches.", visible: true },
    { id: "accessories", name: "Accessories", slug: "accessories", description: "Accessories and community gear.", visible: true },
    { id: "stickers", name: "Stickers", slug: "stickers", description: "1st M.I. decals and stickers.", visible: true },
    { id: "other", name: "Other Gear", slug: "other-gear", description: "Other approved merchandise.", visible: true },
  ],
  shippingZones: [],
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normaliseImages(product: Partial<StoreProduct>): StoreProductImage[] {
  const existing = Array.isArray(product.images)
    ? product.images
        .filter((image) => image && typeof image.url === "string")
        .map((image, index) => ({
          id: String(image.id || `image-${index + 1}`),
          url: String(image.url || ""),
          alt: String(image.alt || product.name || "Product image"),
        }))
    : [];
  if (!existing.length && product.image) {
    return [{ id: "primary", url: String(product.image), alt: String(product.name || "Product image") }];
  }
  return existing;
}

function normaliseVariants(product: Partial<StoreProduct>): StoreProductVariant[] {
  if (!Array.isArray(product.variants)) return [];
  return product.variants.map((variant, index) => ({
    id: String(variant.id || `variant-${index + 1}`),
    name: String(variant.name || `Variant ${index + 1}`),
    sku: String(variant.sku || ""),
    price: String(variant.price ?? ""),
    stockQuantity: Math.max(0, Math.floor(finiteNumber(variant.stockQuantity, 0))),
    active: variant.active !== false,
    options: Array.isArray(variant.options)
      ? variant.options.map((option) => ({ name: String(option.name || "Option"), value: String(option.value || "") }))
      : [],
  }));
}

function normaliseProduct(product: Partial<StoreProduct>, index: number): StoreProduct {
  const name = String(product.name || "New Product");
  const visible = product.visible !== false;
  const status: StoreProductStatus =
    product.status === "draft" || product.status === "hidden" || product.status === "archived" || product.status === "published"
      ? product.status
      : visible
        ? "published"
        : "hidden";
  const images = normaliseImages(product);
  return {
    id: String(product.id || `product-${index + 1}`),
    slug: slugify(String(product.slug || name)),
    sku: String(product.sku || ""),
    name,
    description: String(product.description || ""),
    price: String(product.price ?? ""),
    compareAtPrice: String(product.compareAtPrice ?? ""),
    currency: String(product.currency || "AUD").toUpperCase(),
    category: String(product.category || "Other Gear"),
    image: images[0]?.url || String(product.image || ""),
    images,
    stockStatus: String(product.stockStatus || "Available"),
    stockQuantity: Math.max(0, Math.floor(finiteNumber(product.stockQuantity, 0))),
    trackStock: product.trackStock === true,
    weightGrams: Math.max(0, finiteNumber(product.weightGrams, 0)),
    buyUrl: String(product.buyUrl || ""),
    visible: status === "published",
    featured: product.featured === true,
    status,
    variants: normaliseVariants(product),
    tags: Array.isArray(product.tags) ? product.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
  };
}

function normaliseCategories(input?: Partial<StoreSettings> | null): StoreCategory[] {
  if (!Array.isArray(input?.categories) || !input.categories.length) return DEFAULT_STORE_SETTINGS.categories.map((item) => ({ ...item }));
  return input.categories.map((category, index) => ({
    id: String(category.id || `category-${index + 1}`),
    name: String(category.name || `Category ${index + 1}`),
    slug: slugify(String(category.slug || category.name || `category-${index + 1}`)),
    description: String(category.description || ""),
    visible: category.visible !== false,
  }));
}

function normaliseShipping(input?: Partial<StoreSettings> | null): StoreShippingZone[] {
  if (!Array.isArray(input?.shippingZones)) return [];
  return input.shippingZones.map((zone, index) => ({
    id: String(zone.id || `zone-${index + 1}`),
    name: String(zone.name || `Shipping Zone ${index + 1}`),
    countries: Array.isArray(zone.countries) ? zone.countries.map((code) => String(code).trim().toUpperCase()).filter(Boolean) : [],
    rate: String(zone.rate ?? ""),
    freeOver: String(zone.freeOver ?? ""),
    enabled: zone.enabled !== false,
  }));
}

export function mergeStoreSettings(input?: Partial<StoreSettings> | null): StoreSettings {
  const products = Array.isArray(input?.products)
    ? input.products.map((product, index) => normaliseProduct(product, index))
    : [];

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(input ?? {}),
    enabled: input?.enabled === true,
    defaultCurrency: String(input?.defaultCurrency || "AUD").toUpperCase(),
    products,
    categories: normaliseCategories(input),
    shippingZones: normaliseShipping(input),
  };
}
