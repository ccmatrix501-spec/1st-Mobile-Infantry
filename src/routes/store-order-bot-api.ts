import { createFileRoute } from "@tanstack/react-router";
import type { StoreOrderStatus } from "@/lib/store-orders";

export const Route = createFileRoute("/store-order-bot-api")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected =
          process.env.STORE_ORDER_API_SECRET?.trim() ||
          process.env.STORE_BOT_ORDER_SECRET?.trim() ||
          "";
        const supplied = request.headers.get("x-store-order-secret")?.trim() || "";

        if (!expected) {
          return Response.json(
            { ok: false, error: "STORE_ORDER_API_SECRET is not configured on the website." },
            { status: 503 },
          );
        }
        if (!supplied || supplied !== expected) {
          return Response.json({ ok: false, error: "Invalid store order API secret." }, { status: 401 });
        }

        try {
          const body = (await request.json()) as Record<string, unknown>;
          const action = String(body.action || "").trim();
          const orderId = String(body.orderId || "").trim();
          const admin = await import("@/lib/store-order-discord-admin.server");

          if (action === "get") {
            const order = await admin.discordGetOrder(orderId);
            return Response.json({ ok: true, order });
          }

          if (action === "status") {
            const status = String(body.status || "") as StoreOrderStatus;
            const order = await admin.discordSetOrderStatus(orderId, status);
            return Response.json({ ok: true, order });
          }

          if (action === "edit-customer") {
            const order = await admin.discordEditOrderCustomer(orderId, {
              firstName: body.firstName as string | undefined,
              lastName: body.lastName as string | undefined,
              email: body.email as string | undefined,
              phone: body.phone as string | undefined,
              discordName: body.discordName as string | undefined,
            });
            return Response.json({ ok: true, order });
          }

          if (action === "edit-address") {
            const order = await admin.discordEditOrderAddress(orderId, {
              address: body.address as string | undefined,
              city: body.city as string | undefined,
              state: body.state as string | undefined,
              postalCode: body.postalCode as string | undefined,
              country: body.country as string | undefined,
            });
            return Response.json({ ok: true, order });
          }

          if (action === "edit-shipping") {
            const order = await admin.discordEditOrderShipping(orderId, {
              shippingMethod: body.shippingMethod as string | undefined,
              shippingAmount: body.shippingAmount as string | number | undefined,
            });
            return Response.json({ ok: true, order });
          }

          if (action === "remove") {
            const result = await admin.discordRemoveOrder(orderId);
            return Response.json({ ok: true, ...result });
          }

          return Response.json({ ok: false, error: "Unknown store order action." }, { status: 400 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Store order action failed.";
          return Response.json({ ok: false, error: message }, { status: 400 });
        }
      },
    },
  },
});
