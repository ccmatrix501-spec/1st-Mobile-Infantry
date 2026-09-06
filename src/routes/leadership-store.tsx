import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  ImageIcon,
  PackagePlus,
  Save,
  ShieldCheck,
  Store,
  Trash2,
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
  type StoreSettings,
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

function newProduct(index: number): StoreProduct {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `product-${Date.now()}-${index + 1}`,
    name: "New Product",
    description: "",
    price: "",
    currency: "AUD",
    category: "Merchandise",
    image: "",
    stockStatus: "Available",
    buyUrl: "",
    visible: true,
    featured: false,
  };
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

  function addProduct() {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: [...current.products, newProduct(current.products.length)],
    }));
  }

  function removeProduct(index: number) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      products: current.products.filter((_, productIndex) => productIndex !== index),
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
        body="Build the 1st M.I. Store, manage product listings and keep the entire page hidden until command is ready to publish it."
        meta="1ST MI DIV · LEADERSHIP ONLY"
      />

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild variant="secondary">
            <Link to="/leadership-control">
              <ShieldCheck className="h-4 w-4" />Leadership Control
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/leadership-media">
              <ImageIcon className="h-4 w-4" />Media Library
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/store">
              <Eye className="h-4 w-4" />Preview Store
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="mb-6 rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="panel panel-feature overflow-hidden">
          <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">
              Publication control
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Store Visibility
            </h2>
          </div>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-xl font-semibold uppercase tracking-wide text-fg">
                {settings.enabled ? "Store is Public" : "Store is Hidden"}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                When hidden, the Store does not appear in public navigation and public visitors cannot view your product catalogue. Leadership can still preview it.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-black/30 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => updateSettings({ enabled: event.target.checked })}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              <span className="stencil text-xs tracking-[0.12em] text-fg">
                Public Store
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 panel panel-static p-5 sm:p-6">
          <div className="mb-5">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Store page</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Page Details
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kicker">
              <input
                value={settings.kicker}
                onChange={(event) => updateSettings({ kicker: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Page title">
              <input
                value={settings.title}
                onChange={(event) => updateSettings({ title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Store introduction">
                <textarea
                  value={settings.body}
                  onChange={(event) => updateSettings({ body: event.target.value })}
                  rows={4}
                  className={textareaClass}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Store status / inventory message">
                <textarea
                  value={settings.statusText}
                  onChange={(event) => updateSettings({ statusText: event.target.value })}
                  rows={3}
                  className={textareaClass}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <MediaUploadField
                label="Store banner / hero image"
                help="Upload a JPG, PNG or WebP from your computer, or paste an existing site/HTTPS image URL."
                value={settings.heroImage}
                onChange={(value) => updateSettings({ heroImage: value })}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 panel panel-static p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Inventory</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                Products
              </h2>
              <p className="mt-2 text-sm text-muted">
                {settings.products.length} product{settings.products.length === 1 ? "" : "s"} configured.
              </p>
            </div>
            <Button type="button" onClick={addProduct}>
              <PackagePlus className="h-4 w-4" />Add Product
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
                      <p className="stencil text-[9px] tracking-[0.14em] text-primary">
                        {product.category || "Merchandise"}
                      </p>
                      <p className="truncate font-display text-xl font-semibold uppercase tracking-wide text-fg">
                        {product.name || `Product ${index + 1}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-semibold text-primary">
                        {product.price ? `${product.currency || "AUD"} ${product.price}` : "No price"}
                      </p>
                      <p className="font-mono text-[10px] text-subtle">
                        {product.visible ? "VISIBLE" : "HIDDEN"}{product.featured ? " · FEATURED" : ""}
                      </p>
                    </div>
                  </div>
                </summary>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Product name">
                    <input
                      value={product.name}
                      onChange={(event) => updateProduct(index, { name: event.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Category">
                    <input
                      value={product.category}
                      onChange={(event) => updateProduct(index, { category: event.target.value })}
                      className={inputClass}
                      placeholder="Apparel, patches, accessories…"
                    />
                  </Field>
                  <Field label="Price">
                    <input
                      value={product.price}
                      onChange={(event) => updateProduct(index, { price: event.target.value })}
                      className={inputClass}
                      inputMode="decimal"
                      placeholder="29.95"
                    />
                  </Field>
                  <Field label="Currency">
                    <input
                      value={product.currency}
                      onChange={(event) => updateProduct(index, { currency: event.target.value.toUpperCase() })}
                      className={inputClass}
                      placeholder="AUD"
                    />
                  </Field>
                  <Field label="Stock / availability status">
                    <input
                      value={product.stockStatus}
                      onChange={(event) => updateProduct(index, { stockStatus: event.target.value })}
                      className={inputClass}
                      placeholder="Available, Pre-order, Sold out…"
                    />
                  </Field>
                  <Field label="Purchase link">
                    <input
                      value={product.buyUrl}
                      onChange={(event) => updateProduct(index, { buyUrl: event.target.value })}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description">
                      <textarea
                        value={product.description}
                        onChange={(event) => updateProduct(index, { description: event.target.value })}
                        rows={4}
                        className={textareaClass}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <MediaUploadField
                      label="Product image"
                      help="Upload the product photo directly from your computer."
                      value={product.image}
                      onChange={(value) => updateProduct(index, { image: value })}
                      compact
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-3 rounded-md border border-border bg-black/25 p-4 sm:flex-row sm:items-center">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                      <input
                        type="checkbox"
                        checked={product.visible}
                        onChange={(event) => updateProduct(index, { visible: event.target.checked })}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      Show this product publicly
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg sm:ml-5">
                      <input
                        type="checkbox"
                        checked={product.featured}
                        onChange={(event) => updateProduct(index, { featured: event.target.checked })}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      Featured product
                    </label>
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20 sm:ml-auto"
                    >
                      <Trash2 className="h-4 w-4" />Remove Product
                    </button>
                  </div>
                </div>
              </details>
            ))}

            {!settings.products.length ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-black/20 px-5 py-10 text-center">
                <Store className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">
                  No products yet
                </p>
                <p className="mt-2 text-sm text-muted">Add your first merchandise item when you are ready.</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-4 z-30 mt-6 rounded-xl border border-primary/35 bg-black/90 p-4 shadow-[0_0_40px_rgba(0,0,0,.65)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">Store Changes</p>
              <p className="text-xs text-muted">Products, pricing, images and Store visibility save to Neon.</p>
            </div>
            <div className="flex items-center gap-3">
              {saved ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />Saved
                </span>
              ) : null}
              <Button type="button" size="lg" disabled={saving} onClick={() => void saveStore()}>
                <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Store"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">{label}</span>
      {children}
    </label>
  );
}
