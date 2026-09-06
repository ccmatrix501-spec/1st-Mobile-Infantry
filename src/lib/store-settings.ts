export type StoreProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  image: string;
  stockStatus: string;
  buyUrl: string;
  visible: boolean;
  featured: boolean;
};

export type StoreSettings = {
  enabled: boolean;
  kicker: string;
  title: string;
  body: string;
  statusText: string;
  heroImage: string;
  products: StoreProduct[];
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  enabled: false,
  kicker: "Quartermaster",
  title: "1st M.I. Store",
  body: "Official 1st Mobile Infantry merchandise, apparel, and community gear.",
  statusText: "Store inventory is being prepared. Check back soon.",
  heroImage: "",
  products: [],
};

function normaliseProduct(product: Partial<StoreProduct>, index: number): StoreProduct {
  return {
    id: String(product.id || `product-${index + 1}`),
    name: String(product.name || "New Product"),
    description: String(product.description || ""),
    price: String(product.price ?? ""),
    currency: String(product.currency || "AUD").toUpperCase(),
    category: String(product.category || "Merchandise"),
    image: String(product.image || ""),
    stockStatus: String(product.stockStatus || "Available"),
    buyUrl: String(product.buyUrl || ""),
    visible: product.visible !== false,
    featured: product.featured === true,
  };
}

export function mergeStoreSettings(input?: Partial<StoreSettings> | null): StoreSettings {
  const products = Array.isArray(input?.products)
    ? input!.products.map((product, index) => normaliseProduct(product, index))
    : [];

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...(input ?? {}),
    enabled: input?.enabled === true,
    products,
  };
}
