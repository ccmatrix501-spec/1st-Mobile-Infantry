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
  Trash2,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  editLeadershipStoreOrderAddress,
  editLeadershipStoreOrderCustomer,
  editLeadershipStoreOrderShipping,
  fetchLeadershipStoreOrder,
  removeLeadershipStoreOrder,
  updateLeadershipStoreOrderStatus,
} from "@/lib/store-orders-fn";
import type {
  StoreOrder,
  StoreOrderAddress,
  StoreOrderCustomer,
  StoreOrderStatus,
} from "@/lib/store-orders";
import { formatMoney } from "@/lib/store-utils";

export const Route = createFileRoute("/leadership-order")({
  component: LeadershipOrderPage,
  head: () => ({ meta: [{ title: "Order Details — 1st Mobile Infantry" }] }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function LeadershipOrderPage() {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<StoreOrderStatus>("paid");
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<StoreOrderCustomer>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    discordName: "",
  });
  const [address, setAddress] = useState<StoreOrderAddress>({
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });
  const [shippingMethod, setShippingMethod] = useState("");
  const [shippingAmount, setShippingAmount] = useState("0");

  function applyOrder(value: StoreOrder) {
    setOrder(value);
    setStatus(value.status);
    setCustomer({ ...value.customer, discordName: value.customer.discordName || "" });
    setAddress({ ...value.shippingAddress });
    setShippingMethod(value.shippingMethod);
    setShippingAmount(String(value.shippingAmount));
  }

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
        applyOrder(value);
      })
      .catch((err) => {
        const text = err instanceof Error ? err.message : "Could not load this order.";
        if (text.toLowerCase().includes("session")) {
          const next = `/leadership-order?id=${encodeURIComponent(orderId)}`;
          window.location.href = `/login?next=${encodeURIComponent(next)}`;
          return;
        }
        setError(text);
      })
      .finally(() => setLoading(false));
  }, []);

  async function runSave(work: () => Promise<StoreOrder>, success: string) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await work();
      applyOrder(updated);
      setMessage(success);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this order.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus(nextStatus = status) {
    if (!order) return;
    await runSave(
      () => updateLeadershipStoreOrderStatus({ data: { orderId: order.id, status: nextStatus } }),
      `Order status updated to ${nextStatus}.`,
    );
  }

  async function saveCustomer() {
    if (!order) return;
    await runSave(
      () => editLeadershipStoreOrderCustomer({ data: { orderId: order.id, customer } }),
      "Customer details updated.",
    );
  }

  async function saveAddress() {
    if (!order) return;
    await runSave(
      () => editLeadershipStoreOrderAddress({ data: { orderId: order.id, address } }),
      "Shipping address updated.",
    );
  }

  async function saveShipping() {
    if (!order) return;
    const amount = Number(shippingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Shipping cost must be zero or greater.");
      return;
    }
    await runSave(
      () => editLeadershipStoreOrderShipping({
        data: {
          orderId: order.id,
          shippingMethod,
          shippingAmount: amount,
        },
      }),
      "Shipping details updated.",
    );
  }

  async function removeOrder() {
    if (!order) return;
    const confirmed = window.confirm(
      `Permanently delete ${order.orderNumber}?\n\nThis removes the order from the website database and cannot be undone.`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await removeLeadershipStoreOrder({ data: { orderId: order.id } });
      window.location.href = "/leadership-store/orders";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the order.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">
          Loading full order…
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell>
        <PageHero
          kicker="Quartermaster command"
          title="Order Not Available"
          body="The requested order could not be opened."
          meta="1ST MI DIV · STORE ADMIN"
        />
        <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          {error ? (
            <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <Button asChild variant="secondary">
            <Link to="/leadership-store/orders">
              <ArrowLeft className="h-4 w-4" /> Store Orders
            </Link>
          </Button>
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
          <Button asChild variant="secondary">
            <Link to="/leadership-store/orders"><ArrowLeft className="h-4 w-4" /> All Orders</Link>
          </Button>
          <Button asChild variant="secondary"><Link to="/leadership-store">Store Manager</Link></Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
        ) : null}
        {message ? (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> {message}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            <section className="panel panel-feature p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-2xl font-semibold uppercase text-fg">Customer</h2>
                  <p className="mt-1 text-xs text-muted">Full customer details. These fields are editable.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <EditField label="First name" value={customer.firstName} onChange={(value) => setCustomer((v) => ({ ...v, firstName: value }))} />
                <EditField label="Last name" value={customer.lastName} onChange={(value) => setCustomer((v) => ({ ...v, lastName: value }))} />
                <EditField label="Discord name" value={customer.discordName || ""} onChange={(value) => setCustomer((v) => ({ ...v, discordName: value }))} icon={<MessageCircle className="h-4 w-4" />} />
                <EditField label="Email" value={customer.email} onChange={(value) => setCustomer((v) => ({ ...v, email: value }))} icon={<Mail className="h-4 w-4" />} />
                <EditField label="Phone" value={customer.phone} onChange={(value) => setCustomer((v) => ({ ...v, phone: value }))} icon={<Phone className="h-4 w-4" />} />
              </div>
              <Button className="mt-4" disabled={saving} onClick={() => void saveCustomer()}>
                <Save className="h-4 w-4" /> Save Customer
              </Button>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-display text-2xl font-semibold uppercase text-fg">Shipping Address</h2>
                  <p className="mt-1 text-xs text-muted">Private fulfilment address. Editable by leadership.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <EditField label="Street address" value={address.address} onChange={(value) => setAddress((v) => ({ ...v, address: value }))} />
                </div>
                <EditField label="City" value={address.city} onChange={(value) => setAddress((v) => ({ ...v, city: value }))} />
                <EditField label="State / region" value={address.state} onChange={(value) => setAddress((v) => ({ ...v, state: value }))} />
                <EditField label="Postcode" value={address.postalCode} onChange={(value) => setAddress((v) => ({ ...v, postalCode: value }))} />
                <EditField label="Country" value={address.country} onChange={(value) => setAddress((v) => ({ ...v, country: value }))} />
              </div>
              <Button className="mt-4" disabled={saving} onClick={() => void saveAddress()}>
                <Save className="h-4 w-4" /> Save Address
              </Button>
            </section>

            <section className="panel panel-static p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <PackageCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-semibold uppercase text-fg">Order Items</h2>
              </div>
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
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold uppercase text-fg">Order Summary</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Placed" value={formatDate(order.placedAt)} />
                <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
                <div className="border-t border-border pt-4">
                  <label className="grid gap-2">
                    <span className="stencil text-[8px] tracking-[0.12em] text-primary">Shipping method</span>
                    <input className={inputClass} value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} />
                  </label>
                  <label className="mt-3 grid gap-2">
                    <span className="stencil text-[8px] tracking-[0.12em] text-primary">Shipping cost</span>
                    <input className={inputClass} type="number" min="0" step="0.01" value={shippingAmount} onChange={(e) => setShippingAmount(e.target.value)} />
                  </label>
                  <Button className="mt-3 w-full" variant="secondary" disabled={saving} onClick={() => void saveShipping()}>
                    <Save className="h-4 w-4" /> Save Shipping
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="font-display text-lg uppercase text-fg">Total</span>
                  <span className="font-display text-2xl text-primary">{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </section>

            <section className="panel panel-static p-5">
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Fulfilment</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoreOrderStatus)}
                className={`${inputClass} mt-3`}
              >
                <option value="paid">Paid / New</option>
                <option value="packing">Packing / Approved</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button className="mt-3 w-full" disabled={saving || status === order.status} onClick={() => void saveStatus()}>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Status"}
              </Button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  disabled={saving || order.status === "cancelled"}
                  onClick={() => void saveStatus("cancelled")}
                >
                  <XCircle className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void removeOrder()}
                  className="border-red-400/30 text-red-200 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </section>

            <section className="panel panel-static p-5">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold uppercase text-fg">Payment</h2>
              </div>
              <div className="mt-4 space-y-3">
                <Row label="Provider" value={order.paymentProvider} />
                <Row label="Reference" value={order.paymentReference} />
              </div>
            </section>

            <section className="panel panel-static p-5">
              <div className="flex items-center gap-3">
                {order.discordNotified ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <CircleAlert className="h-5 w-5 text-amber-200" />}
                <div>
                  <p className="font-display text-lg font-semibold uppercase text-fg">Discord</p>
                  <p className="text-xs text-muted">{order.discordNotified ? "Notification sent" : "Notification pending"}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function EditField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center gap-2 stencil text-[8px] tracking-[0.12em] text-primary">
        {icon}{label}
      </span>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="break-all text-right text-fg">{value || "—"}</span>
    </div>
  );
}
