import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { mergeStoreSettings, type StoreSettings } from "@/lib/store-settings";
import { productPrice, shippingOptionPrice } from "@/lib/store-utils";

const DEFAULT_STORE_ORDER_BOT_URL =
  "https://1st-mi-matrix-r-d-production.up.railway.app";

type OrderRequestLine = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type StoreOrderRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  discordName?: string;
  preferredContact: "discord" | "email" | "phone";
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  shippingOptionId: "standard" | "express";
  lines: OrderRequestLine[];
  companyWebsite?: string;
};

function clean(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function prepareBotEnvironment() {
  if (!process.env.STORE_ORDER_BOT_URL?.trim() && !process.env.STORE_BOT_URL?.trim()) {
    process.env.STORE_ORDER_BOT_URL = DEFAULT_STORE_ORDER_BOT_URL;
  }
}

async function readStoreSettings(): Promise<StoreSettings> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql.query<{ config: StoreSettings | string }>(
    "select config from store_settings where id = 'main' limit 1",
  );
  const raw = rows[0]?.config;
  if (!raw) throw new Error("The store is not configured yet.");
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as StoreSettings) : raw;
  return mergeStoreSettings(parsed);
}

async function hasLeadershipSession(): Promise<boolean> {
  try {
    const access = await import("@/lib/local-leadership-access.server");
    return Boolean(await access.getLocalLeadershipProfile());
  } catch {
    return false;
  }
}

export const submitStoreOrderRequest = createServerFn({ method: "POST" })
  .inputValidator((input: StoreOrderRequestInput) => input)
  .handler(async ({ data }) => {
    // Honeypot for simple automated form spam.
    if (clean(data.companyWebsite, 200)) {
      throw new Error("Could not submit this order request.");
    }

    const firstName = clean(data.firstName, 100);
    const lastName = clean(data.lastName, 100);
    const email = clean(data.email, 220);
    const phone = clean(data.phone, 80);
    const discordName = clean(data.discordName, 120);
    const address = clean(data.address, 300);
    const city = clean(data.city, 120);
    const state = clean(data.state, 120);
    const postalCode = clean(data.postalCode, 40);
    const country = clean(data.country, 120);
    const preferredContact =
      data.preferredContact === "discord" ||
      data.preferredContact === "phone" ||
      data.preferredContact === "email"
        ? data.preferredContact
        : "email";

    if (!firstName || !lastName || !email || !address || !city || !country) {
      throw new Error(
        "First name, last name, email, address, city/suburb and country are required.",
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");
    if (preferredContact === "discord" && !discordName) {
      throw new Error("Enter your Discord name if Discord is your preferred contact method.");
    }
    if (preferredContact === "phone" && !phone) {
      throw new Error("Enter your phone number if phone is your preferred contact method.");
    }

    const settings = await readStoreSettings();
    const leadershipTestMode = !settings.enabled && (await hasLeadershipSession());
    if (!settings.enabled && !leadershipTestMode) {
      throw new Error("The store is currently closed for public orders.");
    }

    const shippingOption = settings.shippingOptions.find(
      (option) => option.id === data.shippingOptionId && option.enabled,
    );
    if (!shippingOption || !shippingOption.rate.trim()) {
      throw new Error("Choose a shipping option with a configured price.");
    }

    const requestedLines = Array.isArray(data.lines) ? data.lines.slice(0, 100) : [];
    if (!requestedLines.length) throw new Error("Your cart is empty.");

    const items = requestedLines.map((line) => {
      const product = settings.products.find(
        (candidate) => candidate.id === clean(line.productId, 160),
      );
      if (!product || product.status !== "published") {
        throw new Error("One of the products in your cart is no longer available.");
      }

      const quantity = Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1)));
      const variantId = clean(line.variantId, 160);
      const variant = variantId
        ? product.variants.find((candidate) => candidate.id === variantId && candidate.active)
        : null;
      if (variantId && !variant) {
        throw new Error(`The selected option for ${product.name} is no longer available.`);
      }

      if (product.trackStock) {
        const available = variant ? variant.stockQuantity : product.stockQuantity;
        if (available <= 0) throw new Error(`${product.name} is sold out.`);
        if (quantity > available) {
          throw new Error(`Only ${available} of ${product.name} are currently available.`);
        }
      }

      const unitPrice = productPrice(product, variant);
      if (!(unitPrice > 0)) throw new Error(`${product.name} does not have a valid price yet.`);

      return {
        productId: product.id,
        productName: product.name,
        variantName: variant?.name || undefined,
        quantity,
        unitPrice,
        lineTotal: Math.round(unitPrice * quantity * 100) / 100,
      };
    });

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    const shippingAmount = shippingOptionPrice(shippingOption);
    const total = Math.round((subtotal + shippingAmount) * 100) / 100;
    const contactLabel =
      preferredContact === "discord"
        ? "Discord"
        : preferredContact === "phone"
          ? "Phone"
          : "Email";

    prepareBotEnvironment();
    const orders = await import("@/lib/store-orders.server");
    const order = await orders.recordCompletedStoreOrder(
      {
        currency: settings.defaultCurrency || "AUD",
        subtotal,
        shippingAmount,
        total,
        shippingMethod: shippingOption.name,
        customer: {
          firstName,
          lastName,
          email,
          phone,
          discordName: discordName || undefined,
        },
        shippingAddress: {
          address,
          city,
          state,
          postalCode,
          country,
        },
        items,
        paymentProvider: leadershipTestMode
          ? `Website Test Order — Payment Pending — Staff contact via ${contactLabel}`
          : `Payment Pending — Staff contact via ${contactLabel}`,
        paymentReference: `${leadershipTestMode ? "TEST-ORDER" : "ORDER-REQUEST"}-${randomUUID()}`,
      },
      { test: leadershipTestMode },
    );

    return {
      ok: true,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency,
      preferredContact,
      testMode: leadershipTestMode,
      discordNotified: order.discordNotified,
      discordError: order.discordError,
    };
  });
