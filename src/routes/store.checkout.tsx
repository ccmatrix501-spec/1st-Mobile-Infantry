import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { StoreCurrencyNote, StoreMoney } from "@/components/store-price";
import { StoreToolbar } from "@/components/store-toolbar";
import { Button } from "@/components/ui/button";
import { useStoreCart } from "@/lib/store-cart";
import {
  fetchStorePageAccess,
  type StorePageAccess,
} from "@/lib/store-settings-fn";
import {
  createLeadershipStoreTestPurchase,
  fetchStoreTestPurchaseAccess,
} from "@/lib/store-test-purchase-fn";
import {
  productPrice,
  shippingOptionPrice,
} from "@/lib/store-utils";

export const Route = createFileRoute("/store/checkout")({
  component: StoreCheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — 1st M.I. Store" }] }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/55 px-3 text-sm text-fg outline-none transition-colors placeholder:text-subtle focus:border-primary/70 focus:bg-black/65";

type CheckoutFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discordName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

function StoreCheckoutPage() {
  const [access, setAccess] = useState<StorePageAccess | null>(null);
  const [failed, setFailed] = useState(false);
  const [shippingOptionId, setShippingOptionId] = useState("");
  const [canTestPurchase, setCanTestPurchase] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [fields, setFields] = useState<CheckoutFields>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    discordName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Australia",
  });
  const cart = useStoreCart();

  useEffect(() => {
    let cancelled = false;
    void fetchStorePageAccess()
      .then((value) => {
        if (!cancelled) {
          setAccess(value);
          const firstEnabled = value.settings.shippingOptions.find(
            (option) => option.enabled,
          );
          if (firstEnabled) {
            setShippingOptionId((current) => current || firstEnabled.id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchStoreTestPurchaseAccess()
      .then((allowed) => {
        if (!cancelled) setCanTestPurchase(Boolean(allowed));
      })
      .catch(() => {
        if (!cancelled) setCanTestPurchase(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!access?.visible) return [];
    return cart.lines.flatMap((line) => {
      const product = access.settings.products.find(
        (item) => item.id === line.productId,
      );
      if (!product) return [];
      if (!access.leadershipPreview && product.status !== "published") return [];
      const variant = line.variantId
        ? product.variants.find((item) => item.id === line.variantId) ?? null
        : null;
      const unitPrice = productPrice(product, variant);
      return [
        {
          line,
          product,
          variant,
          unitPrice,
          lineTotal: unitPrice * line.quantity,
        },
      ];
    });
  }, [access, cart.lines]);

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = resolved.reduce((sum, item) => sum + item.line.quantity, 0);
  const shippingOptions =
    access?.settings.shippingOptions.filter((option) => option.enabled) ?? [];
  const shippingOption =
    shippingOptions.find((option) => option.id === shippingOptionId) ?? null;
  const shippingConfigured = Boolean(shippingOption?.rate.trim());
  const shipping = shippingOptionPrice(shippingOption);
  const currency =
    resolved[0]?.product.currency || access?.settings.defaultCurrency || "AUD";
  const total = subtotal + shipping;

  function setField<K extends keyof CheckoutFields>(key: K, value: CheckoutFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function submitTestPurchase() {
    if (!canTestPurchase) return;
    setTestMessage(null);
    setTestError(null);

    const required = [
      fields.firstName,
      fields.lastName,
      fields.email,
      fields.address,
      fields.city,
      fields.country,
    ];
    if (required.some((value) => !value.trim())) {
      setTestError("Fill in first name, last name, email, address, city/suburb and country before running the test purchase.");
      return;
    }
    if (!shippingOption || !shippingConfigured) {
      setTestError("Choose a shipping method with a configured price before running the test purchase.");
      return;
    }
    if (!resolved.length) {
      setTestError("The cart has no valid items to test.");
      return;
    }

    setTestSubmitting(true);
    try {
      const result = await createLeadershipStoreTestPurchase({
        data: {
          currency,
          subtotal,
          shippingAmount: shipping,
          total,
          shippingMethod: shippingOption.name,
          customer: {
            firstName: fields.firstName,
            lastName: fields.lastName,
            email: fields.email,
            phone: fields.phone,
            discordName: fields.discordName || undefined,
          },
          shippingAddress: {
            address: fields.address,
            city: fields.city,
            state: fields.state,
            postalCode: fields.postalCode,
            country: fields.country,
          },
          items: resolved.map(({ line, product, variant, unitPrice, lineTotal }) => ({
            productId: product.id,
            productName: product.name,
            variantName: variant?.name || undefined,
            quantity: line.quantity,
            unitPrice,
            lineTotal,
          })),
        },
      });
      const suffix = result.notificationConfigured
        ? result.notificationMode === "bot-forum"
          ? " A test Forum post was sent through the Discord bot."
          : " A test Discord notification was sent."
        : " The order was created, but Discord notifications are not configured yet.";
      setTestMessage(`Test order ${result.order.orderNumber} created successfully.${suffix}`);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Could not create the test purchase.");
    } finally {
      setTestSubmitting(false);
    }
  }

  if (!access && !failed) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-muted">
          Loading checkout…
        </div>
      </AppShell>
    );
  }

  if (failed || !access?.visible) {
    return (
      <AppShell>
        <PageHero
          kicker="404"
          title="Checkout Not Available"
          body="The Store is not currently available."
          meta="1ST MI DIV · PUBLIC SITE"
        />
      </AppShell>
    );
  }

  if (!resolved.length) {
    return (
      <AppShell>
        <StoreToolbar />
        <PageHero
          kicker="Quartermaster"
          title="Checkout"
          body="Your supply cart is empty."
          meta="1ST MI DIV · CHECKOUT"
        />
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <ShoppingCart className="mx-auto h-10 w-10 text-primary" />
          <Button asChild className="mt-6">
            <Link to="/store">Browse Store</Link>
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {access.leadershipPreview || canTestPurchase ? (
        <div className="border-b border-amber-300/25 bg-amber-300/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <p className="flex items-center gap-2 text-sm text-amber-100">
              <ShieldCheck className="h-4 w-4" />Leadership checkout access
            </p>
            <Link
              to="/leadership-store"
              className="stencil text-[10px] tracking-[0.12em] text-amber-100"
            >
              Store Manager
            </Link>
          </div>
        </div>
      ) : null}
      <StoreToolbar />
      <PageHero
        kicker="Quartermaster"
        title="Checkout"
        body="Enter your delivery details, then choose Standard or Express shipping."
        meta="1ST MI DIV · CHECKOUT"
      />

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-border/80 bg-black/55 p-3 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-md sm:p-5 lg:p-6">
          <div className="mb-5 grid gap-3 rounded-xl border border-border bg-black/45 p-4 sm:grid-cols-2 sm:items-center sm:p-5">
            <div>
              <p className="stencil text-[9px] tracking-[0.14em] text-primary">Checkout</p>
              <p className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                {itemCount} item{itemCount === 1 ? "" : "s"} in this order
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 sm:justify-self-end">
              <Truck className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-fg">Shipping selected here</p>
                <p className="mt-0.5 text-xs text-muted">Enter your address, then choose Standard or Express.</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-50">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-display text-lg font-semibold uppercase tracking-wide">
                  Payments are intentionally disabled
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                  {access.settings.checkoutNotice} Public checkout does not submit or store these details yet.
                  {canTestPurchase ? " Leadership can use the test purchase control below to simulate a completed order without charging anything." : ""}
                </p>
              </div>
            </div>
          </div>

          {testError ? (
            <div className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
              {testError}
            </div>
          ) : null}
          {testMessage ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-primary">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p>{testMessage}</p>
                <Link
                  to="/leadership-store/orders"
                  className="mt-2 inline-block font-semibold underline underline-offset-4"
                >
                  Open Store Orders
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-5">
              <section className="rounded-xl border border-border bg-black/65 p-5 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                    <PackageCheck className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="stencil text-[8px] tracking-[0.14em] text-primary">Step 1</p>
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Contact Details</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="First name">
                    <input
                      className={inputClass}
                      autoComplete="given-name"
                      value={fields.firstName}
                      onChange={(event) => setField("firstName", event.target.value)}
                    />
                  </Field>
                  <Field label="Last name">
                    <input
                      className={inputClass}
                      autoComplete="family-name"
                      value={fields.lastName}
                      onChange={(event) => setField("lastName", event.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      className={inputClass}
                      autoComplete="email"
                      value={fields.email}
                      onChange={(event) => setField("email", event.target.value)}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className={inputClass}
                      autoComplete="tel"
                      value={fields.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-black/65 p-5 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="stencil text-[8px] tracking-[0.14em] text-primary">Step 2</p>
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Details</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Enter the address the order should be delivered to. Shipping is handled at checkout and is not linked to individual product stock.
                </p>

                <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="w-full">
                      <Field label="Discord name (optional)">
                        <input
                          className={inputClass}
                          autoComplete="off"
                          placeholder="e.g. Matrix501 or @Matrix501"
                          value={fields.discordName}
                          onChange={(event) => setField("discordName", event.target.value)}
                        />
                      </Field>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        Optional. Add your Discord name if you would prefer us to identify or contact you there about your order. If supplied, the Discord Forum post title will use this name.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Address">
                      <input
                        className={inputClass}
                        autoComplete="street-address"
                        value={fields.address}
                        onChange={(event) => setField("address", event.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="City / suburb">
                    <input
                      className={inputClass}
                      autoComplete="address-level2"
                      value={fields.city}
                      onChange={(event) => setField("city", event.target.value)}
                    />
                  </Field>
                  <Field label="State / province">
                    <input
                      className={inputClass}
                      autoComplete="address-level1"
                      value={fields.state}
                      onChange={(event) => setField("state", event.target.value)}
                    />
                  </Field>
                  <Field label="Postal / ZIP code">
                    <input
                      className={inputClass}
                      autoComplete="postal-code"
                      value={fields.postalCode}
                      onChange={(event) => setField("postalCode", event.target.value)}
                    />
                  </Field>
                  <Field label="Country / region">
                    <input
                      className={inputClass}
                      autoComplete="country-name"
                      placeholder="Australia"
                      value={fields.country}
                      onChange={(event) => setField("country", event.target.value)}
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-black/65 p-5 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="stencil text-[8px] tracking-[0.14em] text-primary">Step 3</p>
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Shipping Method</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Choose one delivery option. The selected shipping price is added to the order total here at checkout.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {shippingOptions.map((option) => {
                    const selected = option.id === shippingOptionId;
                    return (
                      <label
                        key={option.id}
                        className={`cursor-pointer rounded-xl border p-5 transition-all ${
                          selected
                            ? "border-primary/70 bg-primary/10 shadow-[0_0_30px_rgba(0,0,0,.18)]"
                            : "border-border-strong bg-black/35 hover:border-primary/40 hover:bg-black/45"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shipping-method"
                              value={option.id}
                              checked={selected}
                              onChange={() => setShippingOptionId(option.id)}
                              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
                            />
                            <div>
                              <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                                {option.name}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted">
                                {option.description}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 font-display text-lg font-semibold text-primary">
                            {option.rate.trim() ? (
                              <StoreMoney
                                amount={shippingOptionPrice(option)}
                                currency={currency}
                              />
                            ) : (
                              "Price pending"
                            )}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {!shippingOptions.length ? (
                  <p className="mt-4 text-sm text-muted">
                    Leadership has disabled both shipping options.
                  </p>
                ) : null}
              </section>

              <section className="rounded-xl border border-border bg-black/65 p-5 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="stencil text-[8px] tracking-[0.14em] text-primary">Step 4</p>
                    <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Payment</h2>
                  </div>
                </div>
                <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-black/35 px-5 py-10 text-center">
                  <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
                  <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">Payment provider not connected</p>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    When you decide on the payment provider, this section will be replaced with the secure checkout hand-off. Card details will never be stored by 1stmid.com.
                  </p>
                </div>

                {canTestPurchase ? (
                  <div className="mt-5 rounded-xl border border-primary/35 bg-primary/10 p-5">
                    <div className="flex items-start gap-3">
                      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="stencil text-[9px] tracking-[0.14em] text-primary">Leadership test mode</p>
                        <h3 className="mt-1 font-display text-xl font-semibold uppercase tracking-wide text-fg">Simulate this purchase</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          This creates a TEST order using the cart, customer details and selected shipping method above. No payment is taken. It uses the same order database and Discord notification path so you can test the Forum post end to end.
                        </p>
                        <Button
                          type="button"
                          className="mt-4"
                          disabled={testSubmitting || !shippingOption || !shippingConfigured}
                          onClick={() => void submitTestPurchase()}
                        >
                          <FlaskConical className="h-4 w-4" />
                          {testSubmitting ? "Submitting Test…" : "Submit Test Purchase — No Charge"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="h-fit rounded-xl border border-primary/30 bg-black/75 p-5 shadow-[0_18px_55px_rgba(0,0,0,.35)] backdrop-blur-md sm:p-6 xl:sticky xl:top-24">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="stencil text-[8px] tracking-[0.14em] text-primary">Final review</p>
                  <h2 className="font-display text-2xl font-semibold uppercase tracking-wide text-fg">Order Summary</h2>
                </div>
              </div>
              <div className="mt-3">
                <StoreCurrencyNote baseCurrency={currency} />
              </div>

              <div className="mt-5 space-y-3 rounded-lg border border-border bg-black/35 p-4">
                {resolved.map(({ line, product, variant, lineTotal }) => (
                  <div
                    key={`${line.productId}:${line.variantId}`}
                    className="flex items-start justify-between gap-4 border-b border-border pb-3 text-sm last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-fg">
                        {product.name} × {line.quantity}
                      </p>
                      {variant ? (
                        <p className="mt-1 text-xs text-muted">{variant.name}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-fg">
                      <StoreMoney amount={lineTotal} currency={product.currency} />
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Items</span>
                  <span className="text-fg">{itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-fg">
                    <StoreMoney amount={subtotal} currency={currency} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Shipping</span>
                  <span className="text-right text-fg">
                    {shippingOption
                      ? shippingConfigured
                        ? <StoreMoney amount={shipping} currency={currency} />
                        : "Price pending"
                      : "Select method"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-4 font-display text-xl font-semibold uppercase">
                  <span className="text-fg">Total</span>
                  <span className="text-primary">
                    {shippingOption && shippingConfigured ? (
                      <StoreMoney amount={total} currency={currency} />
                    ) : (
                      "Pending"
                    )}
                  </span>
                </div>
              </div>

              <Button type="button" size="lg" className="mt-6 w-full" disabled>
                <LockKeyhole className="h-4 w-4" />Payment Not Connected
              </Button>
              <Button asChild variant="secondary" className="mt-3 w-full">
                <Link to="/store/cart">
                  <ArrowLeft className="h-4 w-4" />Return to Cart
                </Link>
              </Button>
            </aside>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block stencil text-[9px] tracking-[0.12em] text-primary">
        {label}
      </span>
      {children}
    </label>
  );
}
