import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { mergeStoreSettings, type StoreSettings } from "@/lib/store-settings";

export type Custom3dPrintRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  discordName?: string;
  preferredContact: "discord" | "email" | "phone";
  projectName?: string;
  description: string;
  quantity: number;
  dimensions?: string;
  coloursMaterial?: string;
  budget?: string;
  neededBy?: string;
  referenceLink?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  companyWebsite?: string;
};

function clean(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

function splitText(value: string, max = 165): string[] {
  const text = value.trim();
  if (!text) return [];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > max && chunks.length < 6) {
    let cut = remaining.lastIndexOf(" ", max);
    if (cut < Math.floor(max * 0.6)) cut = max;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining && chunks.length < 7) chunks.push(remaining.slice(0, max));
  return chunks;
}

async function storeAllowsRequest(): Promise<boolean> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  try {
    const rows = await sql.query<{ config: StoreSettings | string }>(
      "select config from store_settings where id = 'main' limit 1",
    );
    const raw = rows[0]?.config;
    if (raw) {
      const parsed = typeof raw === "string" ? (JSON.parse(raw) as StoreSettings) : raw;
      if (mergeStoreSettings(parsed).enabled) return true;
    }
  } catch {
    // If the store table is not ready, public requests remain disabled.
  }

  try {
    const access = await import("@/lib/local-leadership-access.server");
    return Boolean(await access.getLocalLeadershipProfile());
  } catch {
    return false;
  }
}

export const submitCustom3dPrintRequest = createServerFn({ method: "POST" })
  .inputValidator((input: Custom3dPrintRequestInput) => input)
  .handler(async ({ data }) => {
    if (!(await storeAllowsRequest())) {
      throw new Error("Custom 3D print requests are not available while the store is closed.");
    }

    // Simple honeypot. Real customers never see or fill this field.
    if (clean(data.companyWebsite, 200)) {
      throw new Error("Could not submit this request.");
    }

    const firstName = clean(data.firstName, 100);
    const lastName = clean(data.lastName, 100);
    const email = clean(data.email, 220);
    const phone = clean(data.phone, 80);
    const discordName = clean(data.discordName, 120);
    const projectName = clean(data.projectName, 160) || "Custom 3D print";
    const description = clean(data.description, 1200);
    const dimensions = clean(data.dimensions, 180);
    const coloursMaterial = clean(data.coloursMaterial, 180);
    const budget = clean(data.budget, 120);
    const neededBy = clean(data.neededBy, 120);
    const referenceLink = clean(data.referenceLink, 500);
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
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(data.quantity) || 1)));

    if (!firstName || !lastName || !email || !description || !city || !country) {
      throw new Error(
        "First name, last name, email, project details, city/suburb and country are required.",
      );
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }
    if (preferredContact === "discord" && !discordName) {
      throw new Error("Enter your Discord name if Discord is your preferred contact method.");
    }
    if (preferredContact === "phone" && !phone) {
      throw new Error("Enter your phone number if phone is your preferred contact method.");
    }
    if (referenceLink && !/^https:\/\//i.test(referenceLink)) {
      throw new Error("Reference links must start with https://");
    }

    const contactLabel =
      preferredContact === "discord"
        ? `Discord${discordName ? `: ${discordName}` : ""}`
        : preferredContact === "phone"
          ? `Phone${phone ? `: ${phone}` : ""}`
          : `Email: ${email}`;

    const detailChunks = splitText(description);
    const items = [
      {
        productId: "custom-3d-print-request",
        productName: "Custom 3D Print Request",
        variantName: projectName,
        quantity,
        unitPrice: 0,
        lineTotal: 0,
      },
      ...detailChunks.map((chunk, index) => ({
        productId: `custom-3d-print-details-${index + 1}`,
        productName: detailChunks.length > 1 ? `Request details ${index + 1}` : "Request details",
        variantName: chunk,
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
      })),
      ...(dimensions
        ? [{ productId: "custom-3d-print-size", productName: "Approx. size / dimensions", variantName: dimensions, quantity: 1, unitPrice: 0, lineTotal: 0 }]
        : []),
      ...(coloursMaterial
        ? [{ productId: "custom-3d-print-finish", productName: "Colours / material / finish", variantName: coloursMaterial, quantity: 1, unitPrice: 0, lineTotal: 0 }]
        : []),
      ...(budget
        ? [{ productId: "custom-3d-print-budget", productName: "Customer budget", variantName: budget, quantity: 1, unitPrice: 0, lineTotal: 0 }]
        : []),
      ...(neededBy
        ? [{ productId: "custom-3d-print-deadline", productName: "Needed by", variantName: neededBy, quantity: 1, unitPrice: 0, lineTotal: 0 }]
        : []),
      ...(referenceLink
        ? [{ productId: "custom-3d-print-reference", productName: "Reference link", variantName: referenceLink, quantity: 1, unitPrice: 0, lineTotal: 0 }]
        : []),
      {
        productId: "custom-3d-print-contact",
        productName: "Preferred contact",
        variantName: contactLabel,
        quantity: 1,
        unitPrice: 0,
        lineTotal: 0,
      },
    ];

    const orders = await import("@/lib/store-orders.server");
    const order = await orders.recordCompletedStoreOrder({
      currency: "AUD",
      subtotal: 0,
      shippingAmount: 0,
      total: 0,
      shippingMethod: "Shipping to be quoted",
      customer: {
        firstName,
        lastName,
        email,
        phone,
        discordName: discordName || undefined,
      },
      shippingAddress: {
        address: "To be confirmed after quote",
        city,
        state,
        postalCode,
        country,
      },
      items,
      paymentProvider: "Custom 3D Print Quote Request",
      paymentReference: `QUOTE-${randomUUID()}`,
    });

    return {
      ok: true,
      orderNumber: order.orderNumber,
      notificationSent: order.discordNotified,
    };
  });
