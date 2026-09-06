import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  ImageIcon,
  Layers3,
  LockKeyhole,
  PackagePlus,
  Plus,
  Save,
  ShieldCheck,
  Store,
  Tags,
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
  type StoreCategory,
  type StoreProduct,
  type StoreProductImage,
  type StoreProductVariant,
  type StoreSettings,
  type StoreShippingZone,
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
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function newProduct(index: number, currency: string): StoreProduct {
  const id = newId("product");
  return {
    id,
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
    stockStatus: "Available",
    stockQuantity: 0,
    trackStock: false,
    weightGrams: 0,
    buyUrl: "",
    visible: false,
    featured: false,
    status: "draft",
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

function newImage(index: number): StoreProductImage {
  return { id: newId("image"), url: "", alt: `Product image ${index + 1}` };
}

function newCategory(index: number): StoreCategory {
  return {
    id: newId("category"),
    name: `Category ${index + 1}`,
    slug: `category-${index + 1}`,
    description: "",
    visible: true,
  };
}

function newShippingZone(index: number): StoreShippingZone {
  return {
    id: newId("zone"),
    name: `Shipping Zone ${index + 1}`,
    countries: [],
    rate: "",
    freeOver: "",
    enabled: true,
  };
}

function optionsText(variant: StoreProductVariant): string {
  return variant.options.map((option) => `${option.name}: ${option.value}`).join(", ");
}

function parseOptions(value: string): StoreProductVariant["options"] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, ...rest] = part.split(":");
      return {
        name: (name || "Option").trim(),
        value: rest.join(":").trim(),
      };
    })
    .filter((option) => option.value);
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

  function updateVariant(productIndex: number, variantIndex: number, patch: Partial<StoreProductVariant>) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.map((product, index) =>
        index === productIndex
          ? {
              ...product,
              variants: product.variants.map((variant, vIndex) =>
                vIndex === variantIndex ? { ...variant, ...patch } : variant,
              ),
            }
          : product,
      ),
    }));
  }

  function updateImage(productIndex: number, imageIndex: number, patch: Partial<StoreProductImage>) {
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

  function updateCategory(index: number, patch: Partial<StoreCategory>) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      categories: current.categories.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category,
      ),
    }));
  }

  function updateShipping(index: number, patch: Partial<StoreShippingZone>) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      shippingZones: current.shippingZones.map((zone, zoneIndex) =>
        zoneIndex === index ? { ...zone, ...patch } : zone,
      ),
    }));
  }

  async function saveStore() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await saveLeadershipStoreSettings({ data: settings });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save Store settings.");
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
        body="Build the complete 1st M.I. online store, manage inventory and international shipping, and keep it hidden until command is ready to publish."
        meta="1ST MI DIV · LEADERSHIP ONLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary"><Link to="/leadership-control"><ShieldCheck className="h-4 w-4" />Leadership Control</Link></Button>
          <Button asChild variant="secondary"><Link to="/leadership-media"><ImageIcon className="h-4 w-4" />Media Library</Link></Button>
          <Button asChild variant="secondary"><Link to="/store"><Eye className="h-4 w-4" />Preview Store</Link></Button>
          <Button asChild variant="secondary"><Link to="/store/cart"><Store className="h-4 w-4" />Preview Cart</Link></Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        <div className="mb-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-50">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide">Payment processing not connected</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-100/80">The Store, product catalogue, cart and checkout preview can all be built and tested now. The final payment/order submission remains locked until a payment provider is connected.</p>
            </div>
          </div>
        </div>

        <ManagerPanel kicker="Publication control" title="Store Visibility">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">{settings.enabled ? "Store is Public" : "Store is Hidden"}</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">When hidden, the Store does not appear in public navigation. Leadership can still preview every part of it while signed in.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-black/30 px-4 py-3">
              <input type="checkbox" checked={settings.enabled} onChange={(event) => updateSettings({ enabled: event.target.checked })} className="h-5 w-5 accent-[var(--color-primary)]" />
              <span className="stencil text-xs tracking-[0.12em] text-fg">Public Store</span>
            </label>
          </div>
        </ManagerPanel>

        <ManagerPanel kicker="Store page" title="Page Details">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kicker"><input value={settings.kicker} onChange={(event) => updateSettings({ kicker: event.target.value })} className={inputClass} /></Field>
            <Field label="Page title"><input value={settings.title} onChange={(event) => updateSettings({ title: event.target.value })} className={inputClass} /></Field>
            <Field label="Default currency"><input value={settings.defaultCurrency} onChange={(event) => updateSettings({ defaultCurrency: event.target.value.toUpperCase() })} className={inputClass} placeholder="AUD" /></Field>
            <div className="sm:col-span-2"><Field label="Store introduction"><textarea value={settings.body} onChange={(event) => updateSettings({ body: event.target.value })} rows={4} className={textareaClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Store status / inventory message"><textarea value={settings.statusText} onChange={(event) => updateSettings({ statusText: event.target.value })} rows={3} className={textareaClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Cart notice"><textarea value={settings.cartNotice} onChange={(event) => updateSettings({ cartNotice: event.target.value })} rows={3} className={textareaClass} /></Field></div>
            <div className="sm:col-span-2"><Field label="Checkout notice"><textarea value={settings.checkoutNotice} onChange={(event) => updateSettings({ checkoutNotice: event.target.value })} rows={3} className={textareaClass} /></Field></div>
            <div className="sm:col-span-2">
              <MediaUploadField label="Store banner / hero image" help="Upload a JPG, PNG or WebP, or paste an existing site/HTTPS image URL." value={settings.heroImage} onChange={(value) => updateSettings({ heroImage: value })} />
            </div>
          </div>
        </ManagerPanel>

        <ManagerPanel kicker="Catalogue structure" title="Categories" icon={<Tags className="h-5 w-5" />}>
          <div className="space-y-4">
            {settings.categories.map((category, index) => (
              <div key={category.id} className="rounded-lg border border-border bg-black/20 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <Field label="Name"><input value={category.name} onChange={(event) => updateCategory(index, { name: event.target.value })} onBlur={() => !category.slug && updateCategory(index, { slug: slugify(category.name) })} className={inputClass} /></Field>
                  <Field label="URL slug"><input value={category.slug} onChange={(event) => updateCategory(index, { slug: slugify(event.target.value) })} className={inputClass} /></Field>
                  <label className="flex h-11 items-center gap-2 rounded-md border border-border-strong bg-black/30 px-3 text-sm text-fg"><input type="checkbox" checked={category.visible} onChange={(event) => updateCategory(index, { visible: event.target.checked })} />Visible</label>
                  <div className="sm:col-span-2 lg:col-span-3"><Field label="Description"><textarea value={category.description} onChange={(event) => updateCategory(index, { description: event.target.value })} rows={2} className={textareaClass} /></Field></div>
                  <div className="sm:col-span-2 lg:col-span-3"><RemoveButton label="Remove Category" onClick={() => updateSettings({ categories: settings.categories.filter((_, i) => i !== index) })} /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => updateSettings({ categories: [...settings.categories, newCategory(settings.categories.length)] })}><Plus className="h-4 w-4" />Add Category</Button>
          </div>
        </ManagerPanel>

        <ManagerPanel kicker="Inventory" title="Products" icon={<Layers3 className="h-5 w-5" />}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">{settings.products.length} product{settings.products.length === 1 ? "" : "s"} configured.</p>
            <Button type="button" onClick={() => updateSettings({ products: [...settings.products, newProduct(settings.products.length, settings.defaultCurrency)] })}><PackagePlus className="h-4 w-4" />Add Product</Button>
          </div>

          <div className="mt-6 space-y-5">
            {settings.products.map((product, index) => (
              <details key={product.id} className="rounded-xl border border-border bg-black/25 p-4 sm:p-5" open={index === 0}>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="stencil text-[9px] tracking-[0.14em] text-primary">{product.category || "Merchandise"}</p>
                      <p className="truncate font-display text-xl font-semibold uppercase tracking-wide text-fg">{product.name || `Product ${index + 1}`}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-semibold text-primary">{product.price ? `${product.currency || settings.defaultCurrency} ${product.price}` : "No price"}</p>
                      <p className="font-mono text-[10px] text-subtle">{product.status.toUpperCase()}{product.featured ? " · FEATURED" : ""}</p>
                    </div>
                  </div>
                </summary>

                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Product name"><input value={product.name} onChange={(event) => updateProduct(index, { name: event.target.value })} onBlur={() => { if (!product.slug || product.slug.startsWith("new-product-")) updateProduct(index, { slug: slugify(product.name) }); }} className={inputClass} /></Field>
                    <Field label="URL slug"><input value={product.slug} onChange={(event) => updateProduct(index, { slug: slugify(event.target.value) })} className={inputClass} /></Field>
                    <Field label="SKU"><input value={product.sku} onChange={(event) => updateProduct(index, { sku: event.target.value })} className={inputClass} /></Field>
                    <Field label="Category">
                      <select value={product.category} onChange={(event) => updateProduct(index, { category: event.target.value })} className={inputClass}>
                        <option value="Other Gear">Other Gear</option>
                        {settings.categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Product status">
                      <select value={product.status} onChange={(event) => updateProduct(index, { status: event.target.value as StoreProduct["status"], visible: event.target.value === "published" })} className={inputClass}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                    <Field label="Currency"><input value={product.currency} onChange={(event) => updateProduct(index, { currency: event.target.value.toUpperCase() })} className={inputClass} /></Field>
                    <Field label="Base price"><input value={product.price} onChange={(event) => updateProduct(index, { price: event.target.value })} className={inputClass} inputMode="decimal" placeholder="35.00" /></Field>
                    <Field label="Compare-at / old price"><input value={product.compareAtPrice} onChange={(event) => updateProduct(index, { compareAtPrice: event.target.value })} className={inputClass} inputMode="decimal" placeholder="45.00" /></Field>
                    <Field label="Weight (grams)"><input type="number" min="0" value={product.weightGrams} onChange={(event) => updateProduct(index, { weightGrams: Math.max(0, Number(event.target.value) || 0) })} className={inputClass} /></Field>
                    <Field label="Availability label"><input value={product.stockStatus} onChange={(event) => updateProduct(index, { stockStatus: event.target.value })} className={inputClass} placeholder="Available / Pre-order / Sold out" /></Field>
                    <Field label="Base stock quantity"><input type="number" min="0" value={product.stockQuantity} onChange={(event) => updateProduct(index, { stockQuantity: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} className={inputClass} /></Field>
                    <Field label="Tags (comma separated)"><input value={product.tags.join(", ")} onChange={(event) => updateProduct(index, { tags: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} className={inputClass} placeholder="shirt, division, black" /></Field>
                    <div className="sm:col-span-2 lg:col-span-3"><Field label="Description"><textarea value={product.description} onChange={(event) => updateProduct(index, { description: event.target.value })} rows={5} className={textareaClass} /></Field></div>
                  </div>

                  <div className="flex flex-wrap gap-4 rounded-md border border-border bg-black/25 p-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg"><input type="checkbox" checked={product.featured} onChange={(event) => updateProduct(index, { featured: event.target.checked })} />Featured product</label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg"><input type="checkbox" checked={product.trackStock} onChange={(event) => updateProduct(index, { trackStock: event.target.checked })} />Track stock quantities</label>
                  </div>

                  <div className="rounded-lg border border-border bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="stencil text-[10px] tracking-[0.12em] text-primary">Product gallery</p><p className="mt-1 text-xs text-muted">Upload up to 12 images. The first image is the catalogue cover.</p></div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => updateProduct(index, { images: [...product.images, newImage(product.images.length)] })}><Plus className="h-4 w-4" />Add Image</Button>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {product.images.map((image, imageIndex) => (
                        <div key={image.id} className="rounded-md border border-border bg-black/25 p-3">
                          <MediaUploadField label={imageIndex === 0 ? "Primary image" : `Image ${imageIndex + 1}`} help="Upload or choose a Media Library URL." value={image.url} onChange={(value) => updateImage(index, imageIndex, { url: value })} compact />
                          <div className="mt-3"><Field label="Alt text"><input value={image.alt} onChange={(event) => updateImage(index, imageIndex, { alt: event.target.value })} className={inputClass} /></Field></div>
                          <RemoveButton label="Remove Image" onClick={() => updateProduct(index, { images: product.images.filter((_, i) => i !== imageIndex), image: product.images.filter((_, i) => i !== imageIndex)[0]?.url || "" })} />
                        </div>
                      ))}
                    </div>
                    {!product.images.length ? <p className="mt-4 text-sm text-muted">No product images uploaded yet.</p> : null}
                  </div>

                  <div className="rounded-lg border border-border bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="stencil text-[10px] tracking-[0.12em] text-primary">Variants / options</p><p className="mt-1 text-xs text-muted">Use variants for sizes, colours or any option that has its own SKU, price or stock.</p></div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => updateProduct(index, { variants: [...product.variants, newVariant(product.variants.length)] })}><Plus className="h-4 w-4" />Add Variant</Button>
                    </div>
                    <div className="mt-4 space-y-4">
                      {product.variants.map((variant, variantIndex) => (
                        <div key={variant.id} className="rounded-md border border-border bg-black/25 p-4">
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Field label="Variant name"><input value={variant.name} onChange={(event) => updateVariant(index, variantIndex, { name: event.target.value })} className={inputClass} placeholder="Black / XL" /></Field>
                            <Field label="Variant SKU"><input value={variant.sku} onChange={(event) => updateVariant(index, variantIndex, { sku: event.target.value })} className={inputClass} /></Field>
                            <Field label="Price override"><input value={variant.price} onChange={(event) => updateVariant(index, variantIndex, { price: event.target.value })} className={inputClass} inputMode="decimal" placeholder="Leave blank for base price" /></Field>
                            <Field label="Stock quantity"><input type="number" min="0" value={variant.stockQuantity} onChange={(event) => updateVariant(index, variantIndex, { stockQuantity: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} className={inputClass} /></Field>
                            <div className="sm:col-span-2"><Field label="Options — e.g. Size: XL, Colour: Black"><input value={optionsText(variant)} onChange={(event) => updateVariant(index, variantIndex, { options: parseOptions(event.target.value) })} className={inputClass} /></Field></div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-fg"><input type="checkbox" checked={variant.active} onChange={(event) => updateVariant(index, variantIndex, { active: event.target.checked })} />Active variant</label>
                            <RemoveButton label="Remove Variant" onClick={() => updateProduct(index, { variants: product.variants.filter((_, i) => i !== variantIndex) })} compact />
                          </div>
                        </div>
                      ))}
                      {!product.variants.length ? <p className="text-sm text-muted">No variants. The product will use its base price and base stock.</p> : null}
                    </div>
                  </div>

                  <RemoveButton label="Remove Product" onClick={() => updateSettings({ products: settings.products.filter((_, i) => i !== index) })} />
                </div>
              </details>
            ))}

            {!settings.products.length ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-black/20 px-5 py-10 text-center">
                <Store className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">No products yet</p>
                <p className="mt-2 text-sm text-muted">Add your first merchandise item when you are ready.</p>
              </div>
            ) : null}
          </div>
        </ManagerPanel>

        <ManagerPanel kicker="International fulfilment" title="Shipping Zones" icon={<Truck className="h-5 w-5" />}>
          <p className="mb-5 text-sm leading-relaxed text-muted">Create destination groups for Australia, New Zealand, North America, Europe or any other regions you ship to. Use two-letter country codes such as AU, NZ, US, CA, GB.</p>
          <div className="space-y-4">
            {settings.shippingZones.map((zone, index) => (
              <div key={zone.id} className="rounded-lg border border-border bg-black/20 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Zone name"><input value={zone.name} onChange={(event) => updateShipping(index, { name: event.target.value })} className={inputClass} placeholder="Australia" /></Field>
                  <Field label={`Shipping rate (${settings.defaultCurrency})`}><input value={zone.rate} onChange={(event) => updateShipping(index, { rate: event.target.value })} className={inputClass} inputMode="decimal" placeholder="10.00" /></Field>
                  <Field label="Free shipping over"><input value={zone.freeOver} onChange={(event) => updateShipping(index, { freeOver: event.target.value })} className={inputClass} inputMode="decimal" placeholder="Leave blank if none" /></Field>
                  <label className="flex h-11 items-center gap-2 self-end rounded-md border border-border-strong bg-black/30 px-3 text-sm text-fg"><input type="checkbox" checked={zone.enabled} onChange={(event) => updateShipping(index, { enabled: event.target.checked })} />Enabled</label>
                  <div className="sm:col-span-2 lg:col-span-4"><Field label="Country codes (comma separated)"><input value={zone.countries.join(", ")} onChange={(event) => updateShipping(index, { countries: event.target.value.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean) })} className={inputClass} placeholder="AU" /></Field></div>
                  <div className="sm:col-span-2 lg:col-span-4"><RemoveButton label="Remove Shipping Zone" onClick={() => updateSettings({ shippingZones: settings.shippingZones.filter((_, i) => i !== index) })} /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => updateSettings({ shippingZones: [...settings.shippingZones, newShippingZone(settings.shippingZones.length)] })}><Plus className="h-4 w-4" />Add Shipping Zone</Button>
          </div>
        </ManagerPanel>

        <div className="sticky bottom-4 z-30 mt-6 rounded-xl border border-primary/35 bg-black/90 p-4 shadow-[0_0_40px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">Store Changes</p>
              <p className="text-xs text-muted">Products, variants, categories, shipping and Store visibility save together.</p>
            </div>
            <div className="flex items-center gap-3">
              {saved ? <span className="inline-flex items-center gap-1.5 text-sm text-primary"><CheckCircle2 className="h-4 w-4" />Saved</span> : null}
              <Button type="button" size="lg" disabled={saving} onClick={() => void saveStore()}><Save className="h-4 w-4" />{saving ? "Saving…" : "Save Store"}</Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ManagerPanel({ kicker, title, icon, children }: { kicker: string; title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-6 panel panel-static overflow-hidden">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <div><p className="stencil text-[10px] tracking-[0.14em] text-primary">{kicker}</p><h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">{title}</h2></div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block stencil text-[9px] tracking-[0.12em] text-primary">{label}</span>{children}</label>;
}

function RemoveButton({ label, onClick, compact = false }: { label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20 ${compact ? "h-9" : "h-10"}`}>
      <Trash2 className="h-4 w-4" />{label}
    </button>
  );
}
