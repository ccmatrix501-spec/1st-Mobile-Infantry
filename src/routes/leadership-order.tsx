import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Save,
  Truck,
  UserRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipStoreOrder,
  updateLeadershipStoreOrderStatus,
} from "@/lib/store-orders-fn";
import type { StoreOrder, StoreOrderStatus } from "@/lib/store-orders";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-order")({
  component: LeadershipOrderPage,
  head: () => ({ meta: [{ title: "Order Details — 1st Mobile Infantry" }] }),
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short" }).format(date);
}

function LeadershipOrderPage() {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StoreOrderStatus>("paid");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get("id")?.trim() || "";
    if (!orderId) {
      setError("No order id was supplied.");
      setLoading(false);
      return;
    }
    void fetchLeadershipStoreOrder({ data: { orderId } })
      .then((value) => {
        if (!value) throw new Error("Store order was not found.");
        setOrder(value);
        setStatus(value.status);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Could not load this order.";
        if (message.toLowerCase().includes("session")) {
          const next = `/leadership-order?id=${encodeURIComponent(orderId)}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          return;
        }
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveStatus() {
    if (!order) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateLeadershipStoreOrderStatus({
        data: { orderId: order.id, status },
      });
      setOrder(updated);
      setStatus(updated.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order status.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AppShell><div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">Loading full order…</div></AppShell>;
  }

  if (!order) {
    return (
      <AppShell>
        <PageHero kicker="Quartermaster command" title="Order Not Available" body="The requested order could not be opened." meta="1ST MI DIV · STORE ADMIN" />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          {error ? <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
          <Button asChild variant="secondary"><Link to="/leadership-store/orders"><ArrowLeft className="h-4 w-4" /> Store Orders</Link></Button>
        </section>
      </AppShell>
    );
  }

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster command"
        title={order.orderNumber}
        body={`${order.customer.discordName || `${order.customer.firstName} ${order.customer.lastName}`} · ${itemCount} item${itemCount === 1 ? "" : "s"} · ${formatMoney(order.total, order.currency)}`}
        meta="1ST MI DIV · SECURE ORDER DETAILS"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary"><Link to="/leadership-store/orders"><ArrowLeft className="h-4 w-4" /> All Orders</Link></Button>
          <Button asChild variant="secondary"><Link to="/leadership-store">Store Manager</Link></Button>
        </div>

        {error ? <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3"><UserRound className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold uppercase text-fg">Customer</h2></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Info icon={<UserRound className="h-4 w-4" />} label="Name" value={`${order.customer.firstName} ${order.customer.lastName}`} />
                <Info icon={<MessageCircle className="h-4 w-4" />} label="Discord" value={order.customer.discordName || "Not provided"} />
                <Info icon={<Mail className="h-4 w-4" />} label="Email" value={order.customer.email} />
                <Info icon={<Phone className="h-4 w-4" />} label="Phone" value={order.customer.phone || "Not provided"} />
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold uppercase text-fg">Shipping Address</h2></div>
              <div className="mt-5 rounded-xl border border-border bg-black/30 p-5 text-fg">
                <p>{order.shippingAddress.address}</p>
                <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3"><PackageCheck className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold uppercase text-fg">Order Items</h2></div>
              <div className="mt-5 space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="grid gap-2 rounded-lg border border-border bg-black/25 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-display text-lg font-semibold uppercase text-fg">{item.productName}</p>
                      {item.variantName ? <p className="mt-1 text-xs text-muted">{item.variantName}</p> : null}
                      <p className="mt-2 text-xs text-muted">{item.quantity} × {formatMoney(item.unitPrice, order.currency)}</p>
                    </div>
                    <p className="font-display text-xl font-semibold text-primary">{formatMoney(item.lineTotal, order.currency)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:h-fit">
            <section className="panel panel-feature p-5">
              <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold uppercase text-fg">Order Summary</h2></div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Placed" value={formatDate(order.placedAt)} />
                <Row label="Shipping" value={order.shippingMethod} />
                <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                <Row label="Shipping cost" value={formatMoney(order.shippingAmount, order.currency)} />
                <div className="flex items-center justify-between border-t border-border pt-4"><span className="font-display text-lg uppercase text-fg">Total</span><span className="font-display text-2xl text-primary">{formatMoney(order.total, order.currency)}</span></div>
              </div>
            </section>

            <section className="panel panel-static p-5">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Fulfilment</p>
              <select value={status} onChange={(e) => setStatus(e.target.value as StoreOrderStatus)} className="mt-3 h-11 w-full rounded-md border border-border-strong bg-black/55 px-3 text-sm text-fg">
                <option value="paid">Paid / New</option>
                <option value="packing">Packing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button className="mt-3 w-full" disabled={saving || status === order.status} onClick={() => void saveStatus()}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Status"}</Button>
            </section>

            <section className="panel panel-static p-5">
              <div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary" /><h2 className="font-display text-xl font-semibold uppercase text-fg">Payment</h2></div>
              <div className="mt-4 space-y-3"><Row label="Provider" value={order.paymentProvider} /><Row label="Reference" value={order.paymentReference} /></div>
            </section>

            <section className="panel panel-static p-5">
              <div className="flex items-center gap-3">{order.discordNotified ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <CircleAlert className="h-5 w-5 text-amber-200" />}<div><p className="font-display text-lg font-semibold uppercase text-fg">Discord</p><p className="text-xs text-muted">{order.discordNotified ? "Notification sent" : "Notification pending"}</p></div></div>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-black/25 p-4"><div className="flex items-center gap-2 text-primary">{icon}<span className="stencil text-[8px] tracking-[0.12em]">{label}</span></div><p className="mt-2 break-words text-sm text-fg">{value || "—"}</p></div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted">{label}</span><span className="break-all text-right text-fg">{value || "—"}</span></div>;
}
