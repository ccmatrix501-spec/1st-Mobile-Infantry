import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Mail,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreEmailTrackingBuilder } from "@/components/store-email-tracking-builder";
import { Button } from "@/components/ui/button";
import { fetchLeadershipStoreOrders } from "@/lib/store-orders-fn";
import {
  storeOrderCustomerName,
  storeOrderItemCount,
  storeOrderStatusLabel,
  type StoreOrder,
  type StoreOrderStatus,
} from "@/lib/store-orders";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-store_/email")({
  component: LeadershipStoreEmailHubPage,
  head: () => ({
    meta: [{ title: "Store Email Hub — 1st Mobile Infantry" }],
  }),
});

type StatusFilter = "all" | StoreOrderStatus;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function LeadershipStoreEmailHubPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const nextOrders = await fetchLeadershipStoreOrders();
      setOrders(nextOrders);
      setSelectedOrderId((current) => {
        if (current && nextOrders.some((order) => order.id === current)) return current;
        return nextOrders[0]?.id || "";
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Could not load store orders.";
      if (text.toLowerCase().includes("session")) {
        const next = "/leadership-store/email";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
        return;
      }
      setError(text);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!query) return true;

      const haystack = [
        order.orderNumber,
        order.customer.firstName,
        order.customer.lastName,
        order.customer.email,
        order.customer.discordName || "",
        order.shippingAddress.city,
        order.shippingAddress.state,
        order.shippingAddress.country,
        ...order.items.flatMap((item) => [item.productName, item.variantName || ""]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  );

  const activeCount = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  ).length;
  const packingCount = orders.filter((order) => order.status === "packing").length;
  const shippedCount = orders.filter((order) => order.status === "shipped").length;
  const completedCount = orders.filter((order) => order.status === "completed").length;

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster communications"
        title="Store Email Hub"
        body="A small leadership-only email desk for finding an order, building the branded customer email, updating tracking details and copying everything into Outlook."
        meta="1ST MI DIV · STORE ADMIN · CUSTOMER COMMS"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/leadership-store">
              <ArrowLeft className="h-4 w-4" /> Store Manager
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/leadership-store/orders">
              <ShoppingBag className="h-4 w-4" /> Store Orders
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={refreshing}
            onClick={() => void load(true)}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <strong>Email hub:</strong> {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active orders" value={activeCount} icon={<Mail className="h-5 w-5" />} />
          <StatCard label="Packing" value={packingCount} icon={<PackageCheck className="h-5 w-5" />} />
          <StatCard label="Shipped" value={shippedCount} icon={<Truck className="h-5 w-5" />} />
          <StatCard label="Completed" value={completedCount} icon={<CheckCircle2 className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
            <section className="panel panel-feature p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-primary" />
                <div>
                  <p className="stencil text-[9px] tracking-[0.14em] text-primary">Customer communications</p>
                  <h2 className="mt-1 font-display text-xl font-semibold uppercase text-fg">Choose an Order</h2>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search order, customer, email or item…"
                    className="h-11 w-full rounded-md border border-border-strong bg-black/45 pl-10 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-primary/70"
                  />
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="paid">Paid</option>
                  <option value="approved">Approved</option>
                  <option value="packing">Packing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </section>

            <section className="panel panel-static max-h-[62vh] overflow-y-auto p-2">
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-muted">Loading orders…</div>
              ) : !filteredOrders.length ? (
                <div className="px-4 py-10 text-center text-sm text-muted">No matching orders.</div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map((order) => {
                    const selected = order.id === selectedOrderId;
                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? "border-primary/60 bg-primary/10"
                            : "border-border bg-black/25 hover:border-primary/30 hover:bg-surface-hover"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-base font-semibold uppercase text-fg">
                              {order.orderNumber}
                            </p>
                            <p className="mt-1 truncate text-xs text-muted">
                              {storeOrderCustomerName(order)} · {order.customer.email}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-primary/25 bg-primary/5 px-2 py-1 stencil text-[8px] tracking-[0.08em] text-primary">
                            {storeOrderStatusLabel(order.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                          <span>{storeOrderItemCount(order)} item{storeOrderItemCount(order) === 1 ? "" : "s"}</span>
                          <span className="font-semibold text-fg">{formatMoney(order.total, order.currency)}</span>
                        </div>
                        <p className="mt-2 text-[10px] text-subtle">{formatDate(order.placedAt)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>

          <main className="min-w-0">
            {selectedOrder ? (
              <div className="space-y-4">
                <section className="panel panel-static p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="stencil text-[9px] tracking-[0.14em] text-primary">Selected order</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold uppercase text-fg">
                        {selectedOrder.orderNumber}
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {storeOrderCustomerName(selectedOrder)} · {selectedOrder.customer.email}
                      </p>
                    </div>

                    <a
                      href={`/leadership-order?id=${encodeURIComponent(selectedOrder.id)}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-strong bg-surface px-4 font-display text-sm font-semibold uppercase tracking-[0.08em] text-fg transition-colors hover:border-primary/30 hover:bg-surface-hover"
                    >
                      Full Order <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </section>

                <StoreEmailTrackingBuilder key={selectedOrder.id} order={selectedOrder} />
              </div>
            ) : (
              <section className="panel panel-static px-6 py-16 text-center">
                <Mail className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-4 font-display text-2xl font-semibold uppercase text-fg">Select an Order</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  Choose an order from the left to create its customer email, save tracking information, preview the branded message and copy it into Outlook.
                </p>
              </section>
            )}
          </main>
        </div>
      </section>
    </AppShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="panel panel-static p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold text-fg">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
    </div>
  );
}
