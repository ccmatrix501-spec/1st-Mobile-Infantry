import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  PackageSearch,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipStoreOrders,
  fetchStoreOrderSystemStatus,
  sendStoreOrderTestNotification,
} from "@/lib/store-orders-fn";
import {
  storeOrderCustomerName,
  storeOrderItemCount,
  type StoreOrder,
  type StoreOrderSystemStatus,
} from "@/lib/store-orders";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-store/orders")({
  component: LeadershipStoreOrdersPage,
  head: () => ({
    meta: [{ title: "Store Orders — 1st Mobile Infantry" }],
  }),
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: StoreOrder["status"]): string {
  switch (status) {
    case "paid":
      return "Paid / New";
    case "packing":
      return "Packing";
    case "shipped":
      return "Shipped";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function LeadershipStoreOrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [system, setSystem] = useState<StoreOrderSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [nextOrders, nextSystem] = await Promise.all([
        fetchLeadershipStoreOrders(),
        fetchStoreOrderSystemStatus(),
      ]);
      setOrders(nextOrders);
      setSystem(nextSystem);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load store orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendTest() {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      await sendStoreOrderTestNotification();
      setMessage("Test order card sent to the configured Discord channel.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send the Discord test notification.",
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster command"
        title="Store Orders"
        body="Leadership-only order tracking with Discord alerts and secure links to full customer and shipping details."
        meta="1ST MI DIV · STORE ADMIN"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-store">
              <ArrowLeft className="h-4 w-4" />Store Manager
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing}
            onClick={() => void load(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Orders
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel panel-feature p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                  Discord order alerts
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  {system?.discordConfigured ? "Notification channel ready" : "Webhook setup required"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Each completed paid order can post a Discord embed showing the customer name, optional Discord name, order total, items, shipping method and destination summary. Full address, email and phone stay behind the leadership login on the order-details page.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {system?.discordConfigured ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <CircleAlert className="h-5 w-5 text-amber-200" />
                )}
                <div>
                  <p className="text-sm font-semibold text-fg">
                    STORE_DISCORD_WEBHOOK_URL
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {system?.discordConfigured
                      ? "Configured securely on the website host."
                      : "Add a Discord channel webhook URL to the website environment variables."}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                disabled={!system?.discordConfigured || testing}
                onClick={() => void sendTest()}
              >
                <Send className="h-4 w-4" />
                {testing ? "Sending…" : "Send Test Card"}
              </Button>
            </div>
          </section>

          <section className="panel panel-static p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <div>
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                  Order archive
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  {system?.orderCount ?? orders.length} orders
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Orders are stored in the website database so Discord is a notification layer, not the only copy of the order.
            </p>
          </section>
        </div>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                Recent orders
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">
                Order Queue
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="panel panel-static px-6 py-14 text-center text-muted">
              Loading orders…
            </div>
          ) : !orders.length ? (
            <div className="panel panel-static px-6 py-14 text-center">
              <PackageSearch className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                No orders yet
              </h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Completed orders will appear here after the payment/order submission system calls the store order recorder.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="panel panel-static overflow-hidden p-0"
                >
                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 stencil text-[9px] tracking-[0.1em] text-primary">
                          {statusLabel(order.status)}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] ${
                            order.discordNotified
                              ? "border-primary/25 bg-primary/5 text-primary"
                              : "border-amber-300/25 bg-amber-300/5 text-amber-100"
                          }`}
                        >
                          {order.discordNotified ? "Discord notified" : "Discord pending"}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide text-fg sm:text-3xl">
                        {order.orderNumber}
                      </h3>
                      <p className="mt-1 text-xs text-muted">{formatDate(order.placedAt)}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Info label="Customer" value={storeOrderCustomerName(order)} />
                        <Info
                          label="Discord"
                          value={order.customer.discordName || "Not provided"}
                        />
                        <Info
                          label="Items"
                          value={`${storeOrderItemCount(order)} item${storeOrderItemCount(order) === 1 ? "" : "s"}`}
                        />
                        <Info
                          label="Shipping"
                          value={`${order.shippingMethod} · ${order.shippingAddress.country}`}
                        />
                      </div>
                    </div>

                    <div className="flex min-w-[14rem] flex-col gap-3 rounded-xl border border-border bg-black/30 p-4 lg:text-right">
                      <div>
                        <p className="stencil text-[9px] tracking-[0.12em] text-primary">
                          Order total
                        </p>
                        <p className="mt-1 font-display text-3xl font-semibold text-primary">
                          {formatMoney(order.total, order.currency)}
                        </p>
                      </div>
                      <a
                        href={`/leadership-store/orders/${encodeURIComponent(order.id)}`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 font-display text-sm font-semibold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
                      >
                        View Order
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {order.discordError ? (
                    <div className="flex items-start gap-2 border-t border-amber-300/20 bg-amber-300/5 px-5 py-3 text-xs text-amber-100 sm:px-6">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      Discord alert issue: {order.discordError}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-black/30 p-4 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Full customer contact and street-address information is only returned by leadership-authenticated order endpoints. Discord receives a short admin summary and a secure link instead of the complete address.
        </div>
      </section>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-black/25 p-3">
      <p className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</p>
      <p className="mt-1 truncate text-sm text-fg" title={value}>
        {value}
      </p>
    </div>
  );
}
