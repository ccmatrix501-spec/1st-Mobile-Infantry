import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, Save, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchLeadershipStoreSettings,
  saveLeadershipStoreSettings,
} from "@/lib/store-settings-fn";
import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/lib/store-settings";

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";
const textareaClass =
  "min-h-24 w-full rounded-md border border-border-strong bg-black/45 px-3 py-2.5 text-sm text-fg outline-none transition-colors focus:border-primary/70";

function cloneDefaults(): StoreSettings {
  return { ...DEFAULT_STORE_SETTINGS };
}

export function LeadershipStoreControl() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [settings, setSettings] = useState<StoreSettings>(() => cloneDefaults());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pathname !== "/leadership-control") return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchLeadershipStoreSettings()
      .then((value) => {
        if (!cancelled) setSettings(value);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load Store settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (pathname !== "/leadership-control") return null;

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
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

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
      <div className="panel panel-feature overflow-hidden">
        <div className="border-b border-primary/25 bg-primary/10 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Quartermaster</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                Store Page
              </h2>
              <p className="mt-1 text-sm text-muted">
                Build the Store privately, then make it public when you are ready.
              </p>
            </div>
            <Button asChild variant="secondary">
              <Link to="/store">
                <Eye className="h-4 w-4" />Preview Store
              </Link>
            </Button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {loading ? (
            <p className="text-sm text-muted">Loading Store settings…</p>
          ) : (
            <div className="grid gap-6">
              {error ? (
                <div className="rounded-md border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="rounded-lg border border-border bg-black/25 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-md border ${settings.enabled ? "border-primary/40 bg-primary/10 text-primary" : "border-border-strong bg-black/40 text-muted"}`}>
                      {settings.enabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
                        Public Store Visibility
                      </p>
                      <p className="text-sm text-muted">
                        {settings.enabled
                          ? "Store is visible to everyone and appears in site navigation."
                          : "Store is hidden from the public. Leadership can still preview it."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-pressed={settings.enabled}
                    onClick={() => update("enabled", !settings.enabled)}
                    className={`inline-flex min-h-11 items-center justify-center gap-3 rounded-md border px-4 font-display text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${settings.enabled ? "border-primary bg-primary text-black" : "border-border-strong bg-black/45 text-fg hover:border-primary/50"}`}
                  >
                    <span className={`relative h-6 w-11 rounded-full border transition-colors ${settings.enabled ? "border-black/20 bg-black/20" : "border-border-strong bg-surface"}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-current transition-transform ${settings.enabled ? "left-5" : "left-1"}`} />
                    </span>
                    {settings.enabled ? "Public" : "Hidden"}
                  </button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">Kicker</span>
                  <input value={settings.kicker} onChange={(event) => update("kicker", event.target.value)} className={inputClass} />
                </label>
                <label className="grid gap-2">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">Page title</span>
                  <input value={settings.title} onChange={(event) => update("title", event.target.value)} className={inputClass} />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">Store introduction</span>
                  <textarea value={settings.body} onChange={(event) => update("body", event.target.value)} rows={4} className={textareaClass} />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-fg">Inventory / status message</span>
                  <textarea value={settings.statusText} onChange={(event) => update("statusText", event.target.value)} rows={3} className={textareaClass} />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span>
                    <span className="block font-display text-sm font-semibold uppercase tracking-wide text-fg">Store hero image</span>
                    <span className="mt-0.5 block text-xs text-muted">Optional. Use a public site path or HTTPS image URL.</span>
                  </span>
                  <input value={settings.heroImage} onChange={(event) => update("heroImage", event.target.value)} placeholder="/store-hero.jpg" className={inputClass} />
                </label>
              </div>

              {settings.heroImage ? (
                <div className="overflow-hidden rounded-lg border border-border bg-black/30">
                  <img src={settings.heroImage} alt="Store hero preview" className="max-h-80 w-full object-cover" />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  The visibility switch does not take effect until you save.
                </div>
                <div className="flex items-center gap-3">
                  {saved ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" />Saved
                    </span>
                  ) : null}
                  <Button type="button" size="lg" disabled={saving} onClick={() => void save()}>
                    <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Store Settings"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
