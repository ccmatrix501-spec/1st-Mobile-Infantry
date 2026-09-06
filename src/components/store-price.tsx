import type { ReactNode } from "react";
import type { StoreProduct } from "@/lib/store-settings";
import { useStoreCurrency } from "@/lib/store-currency";
import { parseMoney, productPrice } from "@/lib/store-utils";

export function StoreMoney({
  amount,
  currency,
  prefix,
  suffix,
}: {
  amount: number;
  currency: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  const fx = useStoreCurrency([currency], currency || "AUD");
  return <>{prefix}{fx.format(amount, currency)}{suffix}</>;
}

export function StoreProductPrice({ product }: { product: StoreProduct }) {
  const fx = useStoreCurrency([product.currency], product.currency || "AUD");
  const variants = product.variants.filter((variant) => variant.active);
  const values = variants
    .map((variant) => productPrice(product, variant))
    .filter((value) => value > 0);

  if (values.length) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min !== max) return <>From {fx.format(min, product.currency)}</>;
    return <>{fx.format(min, product.currency)}</>;
  }

  const price = parseMoney(product.price);
  return <>{price > 0 ? fx.format(price, product.currency) : "Price pending"}</>;
}

export function StoreCurrencyNote({ baseCurrency }: { baseCurrency: string }) {
  const fx = useStoreCurrency([baseCurrency], baseCurrency || "AUD");
  if (fx.currency === baseCurrency) return null;
  return (
    <span className="text-[10px] text-subtle">
      Displayed in {fx.currency}{fx.rateDate ? ` · rate date ${fx.rateDate}` : ""}
      {fx.rateError ? " · conversion temporarily unavailable" : " · indicative conversion"}
    </span>
  );
}
