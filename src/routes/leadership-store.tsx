import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  ImageIcon,
  LockKeyhole,
  PackagePlus,
  Plus,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { MediaUploadField } from "@/components/media-upload-field";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import {
  fetchLeadershipStoreSettings,
  saveLeadershipStoreSettings,
} from "@/lib/store-settings-fn";
import {
  DEFAULT_STORE_SETTINGS,
  mergeStoreSettings,
  type StoreProduct,
  type StoreProductImage,
  type StoreProductVariant,
  type StoreSettings,
  type StoreShippingOption,
} from "@/lib/store-settings";

export const Route = createFileRoute("/leadership-store")({
  component: LeadershipStorePage,
  head: () => ({
    meta: [{ title: "Store Manager — 1st Mobile Infantry" }],
  }),
});

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass =
  "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function cloneSettings(value: StoreSettings): StoreSettings {
  return JSON.parse(JSON.stringify(value)) as StoreSettings;
}

function newId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

function newProduct(index: number, currency: string): StoreProduct {
  return {
    id: newId("product"),
    slug: `new-product-${index + 1}`,
    sku: "",
    name: "New Product",
    description: "",
    price: "",
    compareAtPrice: "",
    currency: currency || "AUD",
    category: "Other Gear",
    image: "",
    images: [],
    stockStatus: "Sold out",
    stockQuantity: 0,
    trackStock: true,
    weightGrams: 0,
    buyUrl: "",
    visible: true,
    featured: false,
    status: "published",
    variants: [],
    tags: [],
  };
}

function newVariant(index: number): StoreProductVariant {
  return {
    id: newId("variant"),
    name: `Option ${index + 1}`,
    sku: "",
    price: "",
    stockQuantity: 0,
    active: true,
    options: [],
  };
}

function newImage(index: number, productName: string): StoreProductImage {
  return {
    id: newId("image"),
    url: "",
    alt: productName || `Product image ${index + 1}`,
  };
}

function productHasStock(product: StoreProduct): boolean {
  if (product.stockQuantity > 0) return true;
  return product.variants.some(
    (variant) => variant.active && variant.stockQuantity > 0,
  );
}

function simpleStockStatus(product: StoreProduct): "Available" | "Sold out" | "Hidden" {
  if (product.status === "hidden" || product.visible === false) return "Hidden";
  return productHasStock(product) ? "Available" : "Sold out";
}

function optionStockTotal(product: StoreProduct): number {
  return product.variants.reduce(
    (total, variant) => total + Math.max(0, variant.stockQuantity || 0),
    0,
  );
}

function LeadershipStorePage() {
  const [settings, setSettings] = useState<StoreSettings>(() =>
    cloneSettings(DEFAULT_STORE_SETTINGS),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchLocalLeadershipProfile(),
      fetchLeadershipStoreSettings(),
    ])
      .then(([profile, current]) => {
        if (cancelled) return;
        if (!profile) {
          window.location.href = "/login";
          return;
        }
        setSettings(mergeStoreSettings(current));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load Store Manager.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateSettings(patch: Partial<StoreSettings>) {
    setSaved(false);
    setSettings((current) => ({ ...current, ...patch }));
  }

  function updateProduct(index: number, patch: Partial<StoreProduct>) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, productIndex) =>
        productIndex === index ? { ...product, ...patch } : product,
      ),
    }));
  }

  function updateVariant(
    productIndex: number,
    variantIndex: number,
    patch: Partial<StoreProductVariant>,
  ) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, index) => {
        if (index !== productIndex) return product;
        const variants = product.variants.map((variant, vIndex) =>
          vIndex === variantIndex ? { ...variant, ...patch } : variant,
        );
        const next = { ...product, variants };
        return {
          ...next,
          stockStatus:
            next.status === "hidden" || next.visible === false
              ? next.stockStatus
              : productHasStock(next)
                ? "Available"
                : "Sold out",
        };
      }),
    }));
  }

  function updateImage(
    productIndex: number,
    imageIndex: number,
    patch: Partial<StoreProductImage>,
  ) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, index) => {
        if (index !== productIndex) return product;
        const images = product.images.map((image, i) =>
          i === imageIndex ? { ...image, ...patch } : image,
        );
        return { ...product, images, image: images[0]?.url || "" };
      }),
    }));
  }

  function updateShippingOption(
    index: number,
    patch: Partial<StoreShippingOption>,
  ) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      shippingOptions: current.shippingOptions.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, ...patch, enabled: true }
          : option,
      ),
    }));
  }

  function setProductStockStatus(
    index: number,
    nextStatus: "Available" | "Sold out" | "Hidden",
  ) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, productIndex) => {
        if (productIndex !== index) return product;

        if (nextStatus === "Hidden") {
          return {
            ...product,
            stockStatus: "Hidden",
            visible: false,
            status: "hidden",
          };
        }

        if (nextStatus === "Sold out") {
          return {
            ...product,
            stockStatus: "Sold out",
            stockQuantity: 0,
            trackStock: true,
            visible: true,
            status: "published",
            variants: product.variants.map((variant) => ({
              ...variant,
              stockQuantity: 0,
            })),
          };
        }

        return {
          ...product,
          stockStatus: productHasStock(product) ? "Available" : "Sold out",
          trackStock: true,
          visible: true,
          status: "published",
        };
      }),
    }));
  }

  function setProductQuantity(index: number, quantity: number) {
    const safeQuantity = Math.max(0, Math.floor(quantity || 0));
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, productIndex) => {
        if (productIndex !== index) return product;
        const hidden = product.status === "hidden" || product.visible === false;
        const next = {
          ...product,
          stockQuantity: safeQuantity,
          trackStock: true,
        };
        return {
          ...next,
          stockStatus: hidden
            ? product.stockStatus
            : productHasStock(next)
              ? "Available"
              : "Sold out",
        };
      }),
    }));
  }

  async function saveStore() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const simplifiedSettings: StoreSettings = {
      ...settings,
      shippingOptions: settings.shippingOptions.map((option) => ({
        ...option,
        enabled: true,
      })),
      products: settings.products.map((product) => {
        const variants = product.variants.map((variant) => ({
          ...variant,
          sku: "",
          stockQuantity: Math.max(0, Math.floor(variant.stockQuantity || 0)),
          active: true,
          options: [],
        }));
        const normalStock = Math.max(0, Math.floor(product.stockQuantity || 0));
        const hidden = product.status === "hidden" || product.visible === false;
        const anyStock =
          normalStock > 0 || variants.some((variant) => variant.stockQuantity > 0);

        return {
          ...product,
          currency: settings.defaultCurrency,
          compareAtPrice: "",
          trackStock: true,
          stockQuantity: normalStock,
          stockStatus: hidden ? "Hidden" : anyStock ? "Available" : "Sold out",
          variants,
        };
      }),
    };

    try {
      const updated = await saveLeadershipStoreSettings({
        data: simplifiedSettings,
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save Store settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-center text-muted sm:px-6">
          Loading Store Manager…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Quartermaster command"
        title="Store Manager"
        body="A simple admin page for products, stock and checkout shipping costs."
        meta="1ST MI DIV · LEADERSHIP ONLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-control">
              <ShieldCheck className="h-4 w-4" />
              Leadership Control
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/leadership-media">
              <ImageIcon className="h-4 w-4" />
              Media Library
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/store">
              <Eye className="h-4 w-4" />
              Preview Store
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/store/cart">
              <Store className="h-4 w-4" />
              Preview Cart
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mb-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-50">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide">
                Staff-assisted payment
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                Customers submit the order first. Website Staff then contacts them with the selected PayPal or Venmo payment details.
              </p>
            </div>
          </div>
        </div>

        <ManagerPanel kicker="Publication" title="Store Visibility">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                {settings.enabled ? "Store is Public" : "Store is Hidden"}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                Leadership can preview and test the store while it is hidden. Turn this on when you want customers to see it.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-black/30 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) =>
                  updateSettings({ enabled: event.target.checked })
                }
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <span className="stencil text-xs tracking-[0.12em] text-fg">
                Public Store
              </span>
            </label>
          </div>
        </ManagerPanel>

        <ManagerPanel
          kicker="Checkout"
          title="Shipping Cost Editor"
          icon={<Truck className="h-5 w-5" />}
        >
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Edit the two shipping prices customers can choose at checkout. The customer enters their delivery address at checkout, so there are no shipping zones on products.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {settings.shippingOptions.map((option, index) => (
              <div
                key={option.id}
                className="rounded-lg border border-border bg-black/20 p-5"
              >
                <Field
                  label={`${option.name} shipping cost (${settings.defaultCurrency})`}
                >
                  <input
                    value={option.rate}
                    onChange={(event) =>
                      updateShippingOption(index, { rate: event.target.value })
                    }
                    className={inputClass}
                    inputMode="decimal"
                    placeholder="Enter shipping price"
                  />
                </Field>
                <p className="mt-3 text-xs text-muted">
                  {option.id === "standard"
                    ? "Shown as Standard Shipping at checkout."
                    : "Shown as Express Shipping at checkout."}
                </p>
              </div>
            ))}
          </div>
        </ManagerPanel>

        <ManagerPanel
          kicker="Inventory"
          title="Products"
          icon={<PackagePlus className="h-5 w-5" />}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Edit the normal product and each optional version separately, including individual stock counts.
            </p>
            <Button
              type="button"
              onClick={() =>
                updateSettings({
                  products: [
                    ...settings.products,
                    newProduct(
                      settings.products.length,
                      settings.defaultCurrency,
                    ),
                  ],
                })
              }
            >
              <PackagePlus className="h-4 w-4" />
              Add Product
            </Button>
          </div>

          <div className="mt-6 space-y-5">
            {settings.products.map((product, index) => (
              <details
                key={product.id}
                className="rounded-xl border border-border bg-black/25 p-4 sm:p-5"
                open={index === 0}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-semibold uppercase tracking-wide text-fg">
                        {product.name || `Product ${index + 1}`}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {simpleStockStatus(product)} · Normal {product.stockQuantity} · Options {optionStockTotal(product)}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-lg font-semibold text-primary">
                      {product.price
                        ? `${settings.defaultCurrency} ${product.price}`
                        : "No price"}
                    </p>
                  </div>
                </summary>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product name">
                      <input
                        value={product.name}
                        onChange={(event) =>
                          updateProduct(index, { name: event.target.value })
                        }
                        onBlur={() => {
                          if (
                            !product.slug ||
                            product.slug.startsWith("new-product-")
                          ) {
                            updateProduct(index, {
                              slug: slugify(product.name),
                            });
                          }
                        }}
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      label={`Normal product price (${settings.defaultCurrency})`}
                    >
                      <input
                        value={product.price}
                        onChange={(event) =>
                          updateProduct(index, {
                            price: event.target.value,
                            currency: settings.defaultCurrency,
                            compareAtPrice: "",
                          })
                        }
                        className={inputClass}
                        inputMode="decimal"
                        placeholder="35.00"
                      />
                    </Field>

                    <Field label="Stock status">
                      <select
                        value={simpleStockStatus(product)}
                        onChange={(event) =>
                          setProductStockStatus(
                            index,
                            event.target.value as
                              | "Available"
                              | "Sold out"
                              | "Hidden",
                          )
                        }
                        className={inputClass}
                      >
                        <option value="Available">Available</option>
                        <option value="Sold out">Sold out</option>
                        <option value="Hidden">Hidden from store</option>
                      </select>
                    </Field>

                    <Field label="Normal product stock">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={product.stockQuantity}
                        onChange={(event) =>
                          setProductQuantity(
                            index,
                            Number(event.target.value) || 0,
                          )
                        }
                        className={inputClass}
                      />
                      <p className="mt-1 text-xs text-muted">
                        This is only for the standard product with no option selected.
                      </p>
                    </Field>

                    <div className="sm:col-span-2">
                      <Field label="Product description">
                        <textarea
                          value={product.description}
                          onChange={(event) =>
                            updateProduct(index, {
                              description: event.target.value,
                            })
                          }
                          rows={5}
                          className={textareaClass}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="stencil text-[10px] tracking-[0.12em] text-primary">
                          Product images
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          The first image is used as the main product image.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          updateProduct(index, {
                            images: [
                              ...product.images,
                              newImage(product.images.length, product.name),
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add Image
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {product.images.map((image, imageIndex) => (
                        <div
                          key={image.id}
                          className="rounded-md border border-border bg-black/25 p-3"
                        >
                          <MediaUploadField
                            label={
                              imageIndex === 0
                                ? "Primary image"
                                : `Image ${imageIndex + 1}`
                            }
                            help="Upload an image or choose one from the Media Library."
                            value={image.url}
                            onChange={(value) =>
                              updateImage(index, imageIndex, {
                                url: value,
                                alt: product.name || image.alt,
                              })
                            }
                            compact
                          />
                          <div className="mt-3">
                            <RemoveButton
                              label="Remove Image"
                              onClick={() => {
                                const images = product.images.filter(
                                  (_, i) => i !== imageIndex,
                                );
                                updateProduct(index, {
                                  images,
                                  image: images[0]?.url || "",
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {!product.images.length ? (
                      <p className="mt-4 text-sm text-muted">
                        No product images uploaded yet.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-border bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="stencil text-[10px] tracking-[0.12em] text-primary">
                          Product options
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Each option has its own price and its own stock count. Customers can still buy the normal product without selecting an option.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          updateProduct(index, {
                            variants: [
                              ...product.variants,
                              newVariant(product.variants.length),
                            ],
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {product.variants.map((variant, variantIndex) => (
                        <div
                          key={variant.id}
                          className="grid gap-3 rounded-md border border-border bg-black/25 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.45fr)_minmax(8rem,0.32fr)_auto] lg:items-end"
                        >
                          <Field label={`Option ${variantIndex + 1}`}>
                            <input
                              value={variant.name}
                              onChange={(event) =>
                                updateVariant(index, variantIndex, {
                                  name: event.target.value,
                                  sku: "",
                                  active: true,
                                  options: [],
                                })
                              }
                              className={inputClass}
                              placeholder="e.g. 100 mm or Magnet Back"
                            />
                          </Field>

                          <Field label={`Option price (${settings.defaultCurrency})`}>
                            <input
                              value={variant.price}
                              onChange={(event) =>
                                updateVariant(index, variantIndex, {
                                  price: event.target.value,
                                })
                              }
                              className={inputClass}
                              inputMode="decimal"
                              placeholder={product.price || "35.00"}
                            />
                          </Field>

                          <Field label="Option stock">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stockQuantity}
                              onChange={(event) =>
                                updateVariant(index, variantIndex, {
                                  stockQuantity: Math.max(
                                    0,
                                    Math.floor(Number(event.target.value) || 0),
                                  ),
                                })
                              }
                              className={inputClass}
                            />
                          </Field>

                          <RemoveButton
                            label="Remove Option"
                            onClick={() =>
                              updateProduct(index, {
                                variants: product.variants.filter(
                                  (_, i) => i !== variantIndex,
                                ),
                              })
                            }
                            compact
                          />
                        </div>
                      ))}

                      {!product.variants.length ? (
                        <p className="text-sm text-muted">
                          No product options. Customers will buy the normal product at its normal price and normal stock count.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <RemoveButton
                    label="Remove Product"
                    onClick={() =>
                      updateSettings({
                        products: settings.products.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  />
                </div>
              </details>
            ))}

            {!settings.products.length ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-black/20 px-5 py-10 text-center">
                <Store className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  No products yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Add your first store product when you are ready.
                </p>
              </div>
            ) : null}
          </div>
        </ManagerPanel>

        <div className="sticky bottom-4 z-30 mt-6 rounded-xl border border-primary/35 bg-black/90 p-4 shadow-[0_0_40px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                Store Changes
              </p>
              <p className="text-xs text-muted">
                Product details, normal stock, individual option stock, option prices and shipping costs save together.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saved ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </span>
              ) : null}
              <Button
                type="button"
                size="lg"
                disabled={saving}
                onClick={() => void saveStore()}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Store"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ManagerPanel({
  kicker,
  title,
  icon,
  children,
}: {
  kicker: string;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 panel panel-static overflow-hidden">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <div>
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">
              {kicker}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              {title}
            </h2>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block stencil text-[9px] tracking-[0.12em] text-primary">
        {label}
      </span>
      {children}
    </label>
  );
}

function RemoveButton({
  label,
  onClick,
  compact = false,
}: {
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20 ${
        compact ? "h-9" : "h-10"
      }`}
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </button>
  );
}
