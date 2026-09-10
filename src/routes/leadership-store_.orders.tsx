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
  ShoppingBag,
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

export const Route = createFileRoute("/leadership-store_/orders")({
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
    case "paid": return "Paid / New";
    case "packing": return "Packing";
    case "shipped": return "Shipped";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
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
      setError(err instanceof Error ? err.message : "Could not load store orders.");
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
      setMessage("Test order card sent successfully. Check the Store Orders Forum in Discord.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the Discord test notification.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster command"
        title="Store Orders"
        body="Leadership-only order tracking, fulfilment and Discord Forum notifications."
        meta="1ST MI DIV · STORE ADMIN"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-store">
              <ArrowLeft className="h-4 w-4" /> Store Manager
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
            <strong>Store order system:</strong> {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel panel-feature p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <BellRing className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Discord Forum bridge</p>
                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  {system?.discordConfigured ? "Notification bridge configured" : "Notification bridge not configured"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Completed orders are sent to the Store Orders Forum. The Forum post uses the customer&apos;s Discord name when one was supplied and links back to the secure order details here.
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
                    {system?.discordConfigured ? "Ready to send" : "Connection setup required"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {system?.discordConfigured
                      ? "Use Send Test Card to verify the Discord Forum connection."
                      : "The website cannot currently authenticate to the Discord bot order bridge."}
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
                <p className="stencil text-[9px] tracking-[0.14em] text-primary">Order archive</p>
                <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                  {system?.orderCount ?? orders.length} orders
                </h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Discord is only the notification layer. Full order and shipping details remain stored behind the leadership login on this website.
            </p>
          </section>
        </div>

        <section className="mt-6">
          <div className="mb-4">
            <p className="stencil text-[9px] tracking-[0.14em] text-primary">Recent orders</p>
            <h2 className="mt-1 font-display text-3xl font-semibold uppercase tracking-wide text-fg">Order Queue</h2>
          </div>

          {loading ? (
            <div className="panel panel-static px-6 py-14 text-center text-muted">Loading orders…</div>
          ) : !orders.length ? (
            <div className="panel panel-static px-6 py-14 text-center">
              <PackageSearch className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-semibold uppercase tracking-wide text-fg">No orders yet</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Test purchases and completed customer orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article key={order.id} className="panel panel-static overflow-hidden p-0">
                  <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 stencil text-[9px] tracking-[0.1em] text-primary">
                          {statusLabel(order.status)}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] ${order.discordNotified ? "border-primary/25 bg-primary/5 text-primary" : "border-amber-300/25 bg-amber-300/5 text-amber-100"}`}>
                          {order.discordNotified ? "Discord notified" : "Discord pending"}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl font-semibold uppercase tracking-wide text-fg sm:text-3xl">
                        {order.orderNumber}
                      </h3>
                      <p className="mt-1 text-xs text-muted">{formatDate(order.placedAt)}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Info label="Customer" value={storeOrderCustomerName(order)} />
                        <Info label="Discord" value={order.customer.discordName || "Not provided"} />
                        <Info label="Items" value={`${storeOrderItemCount(order)} item${storeOrderItemCount(order) === 1 ? "" : "s"}`} />
                        <Info label="Shipping" value={`${order.shippingMethod} · ${order.shippingAddress.country}`} />
                      </div>
                    </div>

                    <div className="flex min-w-[14rem] flex-col gap-3 rounded-xl border border-border bg-black/30 p-4 lg:text-right">
                      <div>
                        <p className="stencil text-[9px] tracking-[0.12em] text-primary">Order total</p>
                        <p className="mt-1 font-display text-3xl font-semibold text-primary">
                          {formatMoney(order.total, order.currency)}
                        </p>
                      </div>
                      <Link
                        to="/leadership-store/orders/$orderId"
                        params={{ orderId: order.id }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 font-display text-sm font-semibold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
                      >
                        View Order <ExternalLink className="h-4 w-4" />
                      </Link>
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
      </section>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-black/25 p-3">
      <p className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</p>
      <p className="mt-1 truncate text-sm text-fg" title={value}>{value}</p>
    </div>
  );
}
