import { createServerFn } from "@tanstack/react-start";

type CurrencyRatesInput = {
  bases: string[];
  quote: string;
};

export type CurrencyRatesResult = {
  quote: string;
  rates: Record<string, number>;
  date: string | null;
};

type CachedRate = {
  rate: number;
  date: string | null;
  expiresAt: number;
};

const globalCache = globalThis as typeof globalThis & {
  __storeCurrencyRateCache__?: Map<string, CachedRate>;
};

globalCache.__storeCurrencyRateCache__ ??= new Map<string, CachedRate>();

function normaliseCode(value: string): string {
  const code = String(value || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new Error("Invalid currency code.");
  return code;
}

async function fetchRate(base: string, quote: string): Promise<CachedRate> {
  if (base === quote) {
    return { rate: 1, date: null, expiresAt: Date.now() + 60 * 60 * 1000 };
  }

  const cache = globalCache.__storeCurrencyRateCache__!;
  const key = `${base}:${quote}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}.`);
    const data = (await response.json()) as { rate?: number; date?: string };
    const rate = Number(data.rate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Exchange-rate service returned an invalid rate.");

    const value: CachedRate = {
      rate,
      date: typeof data.date === "string" ? data.date : null,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    cache.set(key, value);
    return value;
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchStoreCurrencyRates = createServerFn({ method: "POST" })
  .inputValidator((input: CurrencyRatesInput) => input)
  .handler(async ({ data }): Promise<CurrencyRatesResult> => {
    const quote = normaliseCode(data.quote);
    const bases = [...new Set((Array.isArray(data.bases) ? data.bases : []).map(normaliseCode))].slice(0, 24);
    const rates: Record<string, number> = {};
    let date: string | null = null;

    const results = await Promise.all(
      bases.map(async (base) => ({ base, value: await fetchRate(base, quote) })),
    );

    for (const { base, value } of results) {
      rates[base] = value.rate;
      if (value.date && (!date || value.date > date)) date = value.date;
    }

    return { quote, rates, date };
  });
