import { createServerFn } from "@tanstack/react-start";
import type { StoreCompletedOrderInput } from "@/lib/store-orders";

const DEFAULT_STORE_ORDER_BOT_URL =
  "https://1st-mi-matrix-r-d-production.up.railway.app";

export type StoreTestPurchaseInput = Omit<
  StoreCompletedOrderInput,
  "paymentProvider" | "paymentReference"
>;

function prepareStoreOrderBotEnvironment() {
  if (!process.env.STORE_ORDER_BOT_URL?.trim() && !process.env.STORE_BOT_URL?.trim()) {
    process.env.STORE_ORDER_BOT_URL = DEFAULT_STORE_ORDER_BOT_URL;
  }
}

function websiteStoreOrderSecretConfigured(): boolean {
  return Boolean(
    process.env.STORE_ORDER_API_SECRET?.trim() ||
      process.env.STORE_BOT_ORDER_SECRET?.trim(),
  );
}

export const fetchStoreTestPurchaseAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<boolean> => {
    try {
      const access = await import("@/lib/local-leadership-access.server");
      return Boolean(await access.getLocalLeadershipProfile());
    } catch {
      return false;
    }
  },
);

export const createLeadershipStoreTestPurchase = createServerFn({ method: "POST" })
  .inputValidator((input: StoreTestPurchaseInput) => input)
  .handler(async ({ data }) => {
    const access = await import("@/lib/local-leadership-access.server");
    await access.requireLocalLeadership();

    prepareStoreOrderBotEnvironment();

    if (!websiteStoreOrderSecretConfigured()) {
      throw new Error(
        "Discord Forum testing is not connected yet. Add STORE_ORDER_API_SECRET to the website (Vercel) and the Discord bot (Railway) using the exact same long random value, then redeploy both services.",
      );
    }

    const { randomUUID } = await import("node:crypto");
    const orders = await import("@/lib/store-orders.server");
    const order = await orders.recordCompletedStoreOrder(
      {
        ...data,
        paymentProvider: "Website Test Purchase",
        paymentReference: `TEST-${randomUUID()}`,
      },
      { test: true },
    );

    const notificationConfigured = orders.storeOrderDiscordConfigured();
    const notificationMode = orders.storeOrderNotificationMode();

    if (!notificationConfigured) {
      throw new Error(
        "The test order was created, but no Discord notification path is configured on the website.",
      );
    }

    if (!order.discordNotified) {
      const detail =
        order.discordError?.trim() ||
        "Discord notification failed for an unknown reason.";
      throw new Error(
        `Test order ${order.orderNumber} was created, but the Discord notification did not send. ${detail}`,
      );
    }

    return {
      ok: true,
      order,
      notificationConfigured,
      notificationMode,
    };
  });
