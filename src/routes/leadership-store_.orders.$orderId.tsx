import { useCallback, useEffect, useState } from "react";
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
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipStoreOrder,
  resendLeadershipStoreOrderNotification,
  updateLeadershipStoreOrderStatus,
} from "@/lib/store-orders-fn";
import {
  storeOrderCustomerName,
  storeOrderItemCount,
  type StoreOrder,
  type StoreOrderStatus,
} from "@/lib/store-orders";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-store_/orders/$orderId")({
  component: LeadershipStoreOrderDetailsPage,
  head: () => ({
    meta: [{ title: "Order Details — 1st Mobile Infantry" }],
  }),
});

const selectClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/55 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: StoreOrderStatus): string {
  switch (status) {
    case "paid": return "Paid / New";
    case "packing": return "Packing";
    case "shipped": return "Shipped";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
  }
}

function LeadershipStoreOrderDetailsPage() {
  const { orderId } = Route.useParams();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [status, setStatus] = useState<StoreOrderStatus>("paid");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchLeadershipStoreOrder({ data: { orderId } });
      setOrder(next);
      if (next) setStatus(next.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this store order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveStatus() {
    if (!order) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateLeadershipStoreOrderStatus({
        data: { orderId: order.id, status },
      });
      setOrder(updated);
      setStatus(updated.status);
      setMessage(`Order status changed to ${statusLabel(updated.status)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order status.");
    } finally {
      setSaving(false);
    }
  }

  async function resendDiscord() {
    if (!order) return;
    setResending(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await resendLeadershipStoreOrderNotification({
        data: { orderId: order.id },
      });
      setOrder(updated);
      if (updated.discordNotified) {
        setMessage("Discord Forum order card sent successfully.");
      } else {
        setError(updated.discordError || "Discord did not confirm the Forum post.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the Discord order card.");
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">
          Loading order details…
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <PageHero
          kicker="Quartermaster command"
          title="Order Not Found"
          body="This order could not be loaded, or your leadership session has expired."
          meta="1ST MI DIV · STORE ADMIN"
        />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          {error ? (
            <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
          ) : null}
          <Button asChild variant="secondary">
            <Link to="/leadership-store/orders"><ArrowLeft className="h-4 w-4" /> Back to Orders</Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  const address = order.shippingAddress;
  const customer = order.customer;

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster command"
        title={order.orderNumber}
        body={`${order.customer.discordName || storeOrderCustomerName(order)} · ${storeOrderItemCount(order)} item${storeOrderItemCount(order) === 1 ? "" : "s"} · ${formatMoney(order.total, order.currency)}`}
        meta="1ST MI DIV · SECURE ORDER DETAILS"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-store/orders"><ArrowLeft className="h-4 w-4" /> All Orders</Link>
          </Button>
          <Button asChild variant="secondary"><Link to="/leadership-store">Store Manager</Link></Button>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Customer</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail label="Name" value={storeOrderCustomerName(order)} icon={<UserRound className="h-4 w-4" />} />
                <Detail label="Discord name" value={customer.discordName || "Not provided"} icon={<MessageCircle className="h-4 w-4" />} />
                <Detail label="Email" value={customer.email} icon={<Mail className="h-4 w-4" />} />
                <Detail label="Phone" value={customer.phone || "Not provided"} icon={<Phone className="h-4 w-4" />} />
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Address</h2>
              </div>
              <div className="mt-5 rounded-xl border border-border bg-black/30 p-5">
                <p className="text-base leading-7 text-fg">{address.address}</p>
                <p className="text-base leading-7 text-fg">{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
                <p className="text-base leading-7 text-fg">{address.country}</p>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Full customer contact and street-address information stays on this leadership-only page. Discord receives only the order summary.
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Items</h2>
              </div>
              <div className="mt-5 space-y-3">
                {order.items.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="grid gap-3 rounded-lg border border-border bg-black/25 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">{item.productName}</p>
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
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Summary</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Placed" value={formatDate(order.placedAt)} />
                <SummaryRow label="Items" value={String(storeOrderItemCount(order))} />
                <SummaryRow label="Shipping" value={order.shippingMethod} />
                <SummaryRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                <SummaryRow label="Shipping cost" value={formatMoney(order.shippingAmount, order.currency)} />
                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <span className="font-display text-lg font-semibold uppercase text-fg">Total</span>
                  <span className="font-display text-2xl font-semibold text-primary">{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Fulfilment status</p>
              <div className="mt-3">
                <select value={status} onChange={(event) => setStatus(event.target.value as StoreOrderStatus)} className={selectClass}>
                  <option value="paid">Paid / New</option>
                  <option value="packing">Packing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Button type="button" className="mt-3 w-full" disabled={saving || status === order.status} onClick={() => void saveStatus()}>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Status"}
              </Button>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-fg">Payment Record</h2>
              </div>
              <div className="mt-4 space-y-3">
                <DetailPlain label="Provider" value={order.paymentProvider} />
                <DetailPlain label="Reference" value={order.paymentReference} mono />
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                {order.discordNotified ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <CircleAlert className="h-5 w-5 text-amber-200" />}
                <div>
                  <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">Discord Alert</p>
                  <p className="mt-1 text-xs text-muted">
                    {order.discordNotified ? `Sent${order.discordNotifiedAt ? ` · ${formatDate(order.discordNotifiedAt)}` : ""}` : "Not confirmed as sent"}
                  </p>
                </div>
              </div>
              {order.discordError ? (
                <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-relaxed text-amber-100">{order.discordError}</div>
              ) : null}
              <Button type="button" variant="secondary" className="mt-4 w-full" disabled={resending} onClick={() => void resendDiscord()}>
                <Send className="h-4 w-4" /> {resending ? "Sending…" : "Send Discord Card"}
              </Button>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-black/25 p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<p className="stencil text-[8px] tracking-[0.12em]">{label}</p></div>
      <p className="mt-2 break-words text-sm text-fg">{value}</p>
    </div>
  );
}

function DetailPlain({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-black/25 p-3">
      <p className="stencil text-[8px] tracking-[0.12em] text-primary">{label}</p>
      <p className={`mt-1 break-all text-sm text-fg ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-muted">{label}</span><span className="text-right text-fg">{value}</span></div>;
}
