import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import type {
  StoreOrderBotHealth,
  StoreOrderStatus,
  StoreOrderSystemStatus,
} from "@/lib/store-orders";

const DEFAULT_STORE_ORDER_BOT_URL =
  "https://1st-mi-matrix-r-d-production.up.railway.app";

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
}

function prepareStoreOrderBotEnvironment() {
  if (!process.env.STORE_ORDER_BOT_URL?.trim() && !process.env.STORE_BOT_URL?.trim()) {
    process.env.STORE_ORDER_BOT_URL = DEFAULT_STORE_ORDER_BOT_URL;
  }
}

function storeOrderBotUrl(): string {
  const configured =
    process.env.STORE_ORDER_BOT_URL?.trim() ||
    process.env.STORE_BOT_URL?.trim() ||
    DEFAULT_STORE_ORDER_BOT_URL;
  const base = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;
  return base.replace(/\/$/, "");
}

function websiteSecretConfigured(): boolean {
  return Boolean(
    process.env.STORE_ORDER_API_SECRET?.trim() ||
      process.env.STORE_BOT_ORDER_SECRET?.trim(),
  );
}

async function fetchBotHealth(): Promise<StoreOrderBotHealth> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${storeOrderBotUrl()}/store-orders/health`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "1st-Mobile-Infantry-Website/1.0",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        reachable: false,
        botReady: null,
        secretConfigured: null,
        channelId: null,
        error: `Bot bridge health returned HTTP ${response.status}.`,
      };
    }
    const data = (await response.json()) as {
      botReady?: boolean;
      configured?: boolean;
      channelId?: string;
    };
    return {
      reachable: true,
      botReady: data.botReady === true,
      secretConfigured: data.configured === true,
      channelId: typeof data.channelId === "string" ? data.channelId : null,
      error: null,
    };
  } catch (error) {
    return {
      reachable: false,
      botReady: null,
      secretConfigured: null,
      channelId: null,
      error:
        error instanceof Error
          ? `Bot bridge unavailable: ${error.message}`
          : "Bot bridge unavailable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const fetchLeadershipStoreOrders = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireLeadership();
    const orders = await import("@/lib/store-orders.server");
    return orders.listStoreOrders(150);
  },
);

export const fetchLeadershipStoreOrder = createServerFn({ method: "GET" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }) => {
    await requireLeadership();
    const orderId = String(data.orderId || "").trim();
    if (!orderId) throw new Error("Order id is required.");
    const orders = await import("@/lib/store-orders.server");
    return orders.getStoreOrder(orderId);
  });

export const fetchStoreOrderSystemStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreOrderSystemStatus> => {
    await requireLeadership();
    prepareStoreOrderBotEnvironment();
    const orders = await import("@/lib/store-orders.server");
    const [orderCount, botHealth] = await Promise.all([
      orders.countStoreOrders(),
      fetchBotHealth(),
    ]);
    return {
      discordConfigured: orders.storeOrderDiscordConfigured(),
      siteUrl: orders.storeOrderSiteUrl(),
      orderCount,
      notificationMode: orders.storeOrderNotificationMode(),
      websiteBotUrl: storeOrderBotUrl(),
      websiteSecretConfigured: websiteSecretConfigured(),
      botHealth,
    };
  },
);

export const sendStoreOrderTestNotification = createServerFn({ method: "POST" }).handler(
  async () => {
    await requireLeadership();
    prepareStoreOrderBotEnvironment();
    const orders = await import("@/lib/store-orders.server");
    if (!orders.storeOrderDiscordConfigured()) {
      throw new Error(
        "Discord Forum bridge is not configured. Add STORE_ORDER_API_SECRET to Vercel and Railway using the exact same value.",
      );
    }

    // Save a genuine TEST order before notifying Discord so the Forum card's
    // Open Full Order button always points to a real leadership-only record.
    const order = await orders.recordCompletedStoreOrder(
      {
        currency: "AUD",
        subtotal: 15,
        shippingAmount: 10,
        total: 25,
        shippingMethod: "Standard",
        customer: {
          firstName: "Test",
          lastName: "Customer",
          email: "test@example.invalid",
          phone: "Test order",
          discordName: "@TestCustomer",
        },
        shippingAddress: {
          address: "Test address — no parcel will be sent",
          city: "Nambour",
          state: "QLD",
          postalCode: "4560",
          country: "Australia",
        },
        items: [
          {
            productId: "test-product",
            productName: "1st M.I. 3D Printed Logo",
            quantity: 1,
            unitPrice: 15,
            lineTotal: 15,
          },
        ],
        paymentProvider: "Website Test Purchase",
        paymentReference: `ADMIN-TEST-${randomUUID()}`,
      },
      { test: true },
    );

    if (!order.discordNotified) {
      throw new Error(
        `Test order ${order.orderNumber} was saved, but Discord did not confirm the notification. ${order.discordError || "Unknown Discord notification error."}`,
      );
    }

    return { ok: true, order };
  },
);

export const resendLeadershipStoreOrderNotification = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }) => {
    await requireLeadership();
    prepareStoreOrderBotEnvironment();
    const orders = await import("@/lib/store-orders.server");
    return orders.resendStoreOrderDiscordNotification(String(data.orderId || "").trim());
  });

export const updateLeadershipStoreOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; status: StoreOrderStatus }) => input)
  .handler(async ({ data }) => {
    await requireLeadership();
    prepareStoreOrderBotEnvironment();
    const orders = await import("@/lib/store-orders.server");
    return orders.updateStoreOrderStatus(
      String(data.orderId || "").trim(),
      data.status,
    );
  });
