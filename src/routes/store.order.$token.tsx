import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  Clock3,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  fetchPublicStoreOrderTracking,
  type PublicStoreOrderTracking,
} from "@/lib/store-order-tracking-fn";
import type { StoreOrderStatus } from "@/lib/store-orders";

export const Route = createFileRoute("/store/order/$token")({
  component: StoreOrderTrackingPage,
  head: () => ({ meta: [{ title: "Track Order — 1st Mobile Infantry Store" }] }),
});

const PROGRESS: Array<{
  status: Exclude<StoreOrderStatus, "cancelled">;
  label: string;
  description: string;
}> = [
  { status: "new", label: "Order Received", description: "Your order has been recorded by the 1st M.I. Store." },
  { status: "paid", label: "Payment Confirmed", description: "Payment has been confirmed for the order." },
  { status: "approved", label: "Order Approved", description: "The order has been approved for fulfilment." },
  { status: "packing", label: "Preparing Order", description: "Your items are being prepared and packed." },
  { status: "shipped", label: "Shipped", description: "Your parcel has left the store and is on the way." },
  { status: "completed", label: "Completed", description: "The order has been completed." },
];

function statusIndex(status: StoreOrderStatus): number {
  if (status === "cancelled") return -1;
  return PROGRESS.findIndex((step) => step.status === status);
}

function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "AUD",
    }).format(value);
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency || "AUD"}`;
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StoreOrderTrackingPage() {
  const { token } = Route.useParams();
  const [order, setOrder] = useState<PublicStoreOrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    void fetchPublicStoreOrderTracking({ data: { token } })
      .then((value) => {
        if (cancelled) return;
        if (!value) {
          setOrder(null);
          setNotFound(true);
          return;
        }
        setOrder(value);
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null);
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const destination = useMemo(() => {
    if (!order) return "";
    return [order.destination.city, order.destination.state, order.destination.country]
      .filter(Boolean)
      .join(", ");
  }, [order]);

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[58vh] max-w-4xl items-center justify-center px-4 py-20 text-center sm:px-6">
          <div>
            <Clock3 className="mx-auto h-8 w-8 animate-pulse text-primary" />
            <p className="mt-4 font-display text-xl uppercase tracking-wide text-fg">Loading Order Tracking…</p>
            <p className="mt-2 text-sm text-muted">Checking the latest Quartermaster status.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!order || notFound) {
    return (
      <AppShell>
        <PageHero
          kicker="Quartermaster supply"
          title="Tracking Link Not Available"
          body="This tracking link is invalid, expired, or no longer connected to an order."
          meta="1ST MI DIV · CUSTOMER ORDER TRACKING"
        />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <div className="panel panel-static p-7 sm:p-9">
            <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
              If you received this link from the 1st M.I. Store and believe it should still work, reply to your store email and we can provide a fresh tracking link.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/store">Return to Store</Link>
            </Button>
          </div>
        </section>
      </AppShell>
    );
  }

  const currentIndex = statusIndex(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster supply"
        title={`Track ${order.orderNumber}`}
        body={`Hi ${order.customerFirstName}. This page shows the latest fulfilment progress for your 1st M.I. Store order.`}
        meta="1ST MI DIV · SECURE CUSTOMER ORDER TRACKING"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">Private tracking link</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                This link is unique to your order. Keep it private. For your security, this page does not display your email, phone number, payment reference, or full street address.
              </p>
            </div>
          </div>
        </div>

        {cancelled ? (
          <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-200" />
              <div>
                <h2 className="font-display text-2xl font-semibold uppercase text-red-100">Order Cancelled</h2>
                <p className="mt-2 text-sm leading-relaxed text-red-100/80">
                  This order has been marked as cancelled. If you were not expecting this, reply to the store email you received so we can check it for you.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="section-kicker">Live progress</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold uppercase text-fg">Order Progress</h2>
                </div>
              </div>

              <div className="mt-6 space-y-1">
                {PROGRESS.map((step, index) => {
                  const complete = !cancelled && index <= currentIndex;
                  const current = !cancelled && index === currentIndex;
                  return (
                    <div key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
                      {index < PROGRESS.length - 1 ? (
                        <div
                          className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${
                            !cancelled && index < currentIndex ? "bg-primary" : "bg-border-strong"
                          }`}
                        />
                      ) : null}

                      <div className="relative z-10 mt-0.5 shrink-0">
                        {complete ? (
                          <CheckCircle2 className={`h-6 w-6 ${current ? "text-primary" : "text-primary/80"}`} />
                        ) : (
                          <Circle className="h-6 w-6 text-border-strong" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className={`font-display text-lg font-semibold uppercase ${complete ? "text-fg" : "text-muted"}`}>
                          {step.label}
                          {current ? <span className="ml-2 text-xs text-primary">CURRENT</span> : null}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase text-fg">Order Items</h2>
              </div>

              <div className="mt-5 space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="grid gap-2 rounded-lg border border-border bg-black/25 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="font-display text-lg font-semibold uppercase text-fg">{item.productName}</p>
                      {item.variantName ? <p className="mt-1 text-xs text-muted">{item.variantName}</p> : null}
                      <p className="mt-2 text-xs text-muted">
                        {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                      </p>
                    </div>
                    <p className="font-display text-xl font-semibold text-primary">
                      {formatMoney(item.lineTotal, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <section className="panel panel-feature p-5">
              <p className="section-kicker">Order summary</p>
              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Order" value={order.orderNumber} />
                <InfoRow label="Placed" value={formatDate(order.placedAt)} />
                <InfoRow label="Last updated" value={formatDate(order.updatedAt)} />
                <InfoRow label="Destination" value={destination || "Not available"} />
                <InfoRow label="Shipping" value={order.shippingMethod || "Shipping"} />
                <InfoRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                <InfoRow label="Shipping cost" value={formatMoney(order.shippingAmount, order.currency)} />
                <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                  <span className="font-display text-lg uppercase text-fg">Total</span>
                  <span className="font-display text-2xl font-semibold text-primary">
                    {formatMoney(order.total, order.currency)}
                  </span>
                </div>
              </div>
            </section>

            <section className="panel panel-static p-5">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold uppercase text-fg">Delivery</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <InfoRow label="Method" value={order.shippingMethod || "Shipping"} />
                <InfoRow label="Tracking number" value={order.trackingNumber || "Not assigned yet"} />
                <InfoRow label="Estimated delivery" value={order.estimatedDelivery || "Not available yet"} />
              </div>

              {order.status !== "shipped" && order.status !== "completed" && !cancelled ? (
                <p className="mt-4 rounded-md border border-border bg-black/25 px-3 py-3 text-xs leading-relaxed text-muted">
                  Tracking details may appear here once your parcel has been dispatched.
                </p>
              ) : null}
            </section>

            <Button asChild variant="secondary" className="w-full">
              <Link to="/store">Back to 1st M.I. Store</Link>
            </Button>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="break-all text-right text-fg">{value || "—"}</span>
    </div>
  );
}
