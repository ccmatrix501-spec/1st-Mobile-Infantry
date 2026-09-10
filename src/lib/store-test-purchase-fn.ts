import { createServerFn } from "@tanstack/react-start";
import type { StoreCompletedOrderInput } from "@/lib/store-orders";

export type StoreTestPurchaseInput = Omit<
  StoreCompletedOrderInput,
  "paymentProvider" | "paymentReference"
>;

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

    if (notificationConfigured && !order.discordNotified) {
      const detail = order.discordError?.trim() || "Discord notification failed for an unknown reason.";
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
