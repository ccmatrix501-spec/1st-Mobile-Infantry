import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStoreCurrencyRates } from "@/lib/store-currency-fn";
import { formatMoney } from "@/lib/store-utils";

export const STORE_CURRENCY_STORAGE_KEY = "1mi-store-display-currency";
export const STORE_CURRENCY_EVENT = "1mi-store-currency-change";

export const STORE_DISPLAY_CURRENCIES = [
  { code: "AUD", label: "Australian Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "USD", label: "US Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "GBP", label: "British Pound" },
  { code: "EUR", label: "Euro" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "NOK", label: "Norwegian Krone" },
  { code: "DKK", label: "Danish Krone" },
  { code: "PLN", label: "Polish Zloty" },
  { code: "CZK", label: "Czech Koruna" },
  { code: "HUF", label: "Hungarian Forint" },
  { code: "RON", label: "Romanian Leu" },
  { code: "INR", label: "Indian Rupee" },
  { code: "KRW", label: "South Korean Won" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "TWD", label: "New Taiwan Dollar" },
  { code: "THB", label: "Thai Baht" },
  { code: "MYR", label: "Malaysian Ringgit" },
  { code: "PHP", label: "Philippine Peso" },
  { code: "IDR", label: "Indonesian Rupiah" },
  { code: "VND", label: "Vietnamese Dong" },
  { code: "ZAR", label: "South African Rand" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "TRY", label: "Turkish Lira" },
] as const;

function validCurrency(value: string | null | undefined): string | null {
  const code = String(value || "").trim().toUpperCase();
  return STORE_DISPLAY_CURRENCIES.some((item) => item.code === code) ? code : null;
}

export function useStoreCurrency(baseCurrencies: string[] = [], fallbackCurrency = "AUD") {
  const fallback = validCurrency(fallbackCurrency) || "AUD";
  const [currency, setCurrencyState] = useState(fallback);
  const [rates, setRates] = useState<Record<string, number>>({ [fallback]: 1 });
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rateError, setRateError] = useState(false);

  const bases = useMemo(
    () => [...new Set(baseCurrencies.map((item) => String(item || fallback).toUpperCase()).filter((item) => /^[A-Z]{3}$/.test(item)))].sort(),
    [baseCurrencies.join("|"), fallback],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = validCurrency(window.localStorage.getItem(STORE_CURRENCY_STORAGE_KEY));
    if (stored) setCurrencyState(stored);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      const next = validCurrency(detail) || validCurrency(window.localStorage.getItem(STORE_CURRENCY_STORAGE_KEY));
      if (next) setCurrencyState(next);
    };
    window.addEventListener(STORE_CURRENCY_EVENT, onChange);
    return () => window.removeEventListener(STORE_CURRENCY_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!bases.length) {
      setRates({ [currency]: 1 });
      setRateError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setRateError(false);

    void fetchStoreCurrencyRates({ data: { bases, quote: currency } })
      .then((result) => {
        if (cancelled) return;
        setRates({ ...result.rates, [currency]: 1 });
        setRateDate(result.date);
      })
      .catch(() => {
        if (!cancelled) {
          setRates({ [currency]: 1 });
          setRateDate(null);
          setRateError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bases.join("|"), currency]);

  const setCurrency = useCallback((value: string) => {
    const next = validCurrency(value);
    if (!next) return;
    setCurrencyState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORE_CURRENCY_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent<string>(STORE_CURRENCY_EVENT, { detail: next }));
    }
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency: string): number | null => {
      const from = String(fromCurrency || fallback).toUpperCase();
      if (from === currency) return amount;
      const rate = rates[from];
      return Number.isFinite(rate) && rate > 0 ? amount * rate : null;
    },
    [currency, fallback, rates],
  );

  const format = useCallback(
    (amount: number, fromCurrency: string): string => {
      const converted = convert(amount, fromCurrency);
      return converted === null
        ? formatMoney(amount, fromCurrency || fallback)
        : formatMoney(converted, currency);
    },
    [convert, currency, fallback],
  );

  return {
    currency,
    setCurrency,
    convert,
    format,
    loading,
    rateError,
    rateDate,
  };
}
