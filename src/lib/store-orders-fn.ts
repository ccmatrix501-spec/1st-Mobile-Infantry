import { createServerFn } from "@tanstack/react-start";
import type { StoreOrderStatus, StoreOrderSystemStatus } from "@/lib/store-orders";

async function requireLeadership() {
  const access = await import("@/lib/local-leadership-access.server");
  return access.requireLocalLeadership();
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
    const orders = await import("@/lib/store-orders.server");
    return {
      discordConfigured: orders.storeOrderDiscordConfigured(),
      siteUrl: orders.storeOrderSiteUrl(),
      orderCount: await orders.countStoreOrders(),
    };
  },
);

export const sendStoreOrderTestNotification = createServerFn({ method: "POST" }).handler(
  async () => {
    await requireLeadership();
    const orders = await import("@/lib/store-orders.server");
    await orders.sendStoreOrderDiscordTest();
    return { ok: true };
  },
);

export const resendLeadershipStoreOrderNotification = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) => input)
  .handler(async ({ data }) => {
    await requireLeadership();
    const orders = await import("@/lib/store-orders.server");
    return orders.resendStoreOrderDiscordNotification(String(data.orderId || "").trim());
  });

export const updateLeadershipStoreOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; status: StoreOrderStatus }) => input)
  .handler(async ({ data }) => {
    await requireLeadership();
    const orders = await import("@/lib/store-orders.server");
    return orders.updateStoreOrderStatus(
      String(data.orderId || "").trim(),
      data.status,
    );
  });
