import type { StoreProduct, StoreProductVariant, StoreShippingOption } from "@/lib/store-settings";

export function parseMoney(value: string): number {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value: number, currency = "AUD"): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(value);
  } catch {
    return `${currency || "AUD"} ${value.toFixed(2)}`;
  }
}

export function productPrice(product: StoreProduct, variant?: StoreProductVariant | null): number {
  if (variant?.price?.trim()) return parseMoney(variant.price);
  return parseMoney(product.price);
}

export function productDisplayPrice(product: StoreProduct): string {
  const variants = product.variants.filter((variant) => variant.active);
  const values = variants
    .map((variant) => productPrice(product, variant))
    .filter((value) => value > 0);
  if (values.length) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min !== max) return `From ${formatMoney(min, product.currency)}`;
    return formatMoney(min, product.currency);
  }
  const price = parseMoney(product.price);
  return price > 0 ? formatMoney(price, product.currency) : "Price pending";
}

export function productPrimaryImage(product: StoreProduct): string {
  return product.images.find((image) => image.url)?.url || product.image || "";
}

export function productIsPurchasable(product: StoreProduct, variant?: StoreProductVariant | null): boolean {
  if (product.status !== "published") return false;
  if (variant && !variant.active) return false;
  if (product.trackStock) {
    const quantity = variant ? variant.stockQuantity : product.stockQuantity;
    return quantity > 0;
  }
  return product.stockStatus.trim().toLowerCase() !== "sold out";
}

export function shippingOptionPrice(option: StoreShippingOption | null): number {
  if (!option || !option.enabled || !option.rate.trim()) return 0;
  return parseMoney(option.rate);
}
