import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  ImageIcon,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AppShell, PageHero } from "@/components/app-shell";
import { MediaUploadField } from "@/components/media-upload-field";
import { Button } from "@/components/ui/button";
import { fetchLocalLeadershipProfile } from "@/lib/leadership-local-auth-fn";
import {
  deleteLeadershipMedia,
  listLeadershipMedia,
  type LeadershipMediaItem,
} from "@/lib/media-fn";
import {
  DEFAULT_SITE_ADMIN_CONFIG,
  type SiteAdminConfig,
} from "@/lib/site-admin-config";
import {
  fetchLeadershipSiteAdminConfig,
  saveLeadershipSiteAdminConfig,
} from "@/lib/site-admin-config-fn";

export const Route = createFileRoute("/leadership-media")({
  component: LeadershipMediaPage,
  head: () => ({
    meta: [{ title: "Media Library — 1st Mobile Infantry" }],
  }),
});

function cloneConfig(value: SiteAdminConfig): SiteAdminConfig {
  return JSON.parse(JSON.stringify(value)) as SiteAdminConfig;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function LeadershipMediaPage() {
  const [config, setConfig] = useState<SiteAdminConfig>(() =>
    cloneConfig(DEFAULT_SITE_ADMIN_CONFIG),
  );
  const [items, setItems] = useState<LeadershipMediaItem[]>([]);
  const [newUpload, setNewUpload] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshLibrary() {
    setRefreshing(true);
    try {
      const media = await listLeadershipMedia();
      setItems(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the Media Library.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchLocalLeadershipProfile(),
      fetchLeadershipSiteAdminConfig(),
      listLeadershipMedia(),
    ])
      .then(([profile, managed, media]) => {
        if (cancelled) return;
        if (!profile) {
          window.location.href = "/login";
          return;
        }
        setConfig(managed);
        setItems(media);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load the Media Library.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAppearance() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await saveLeadershipSiteAdminConfig({ data: config });
      setConfig(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save website images.");
    } finally {
      setSaving(false);
    }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied((current) => (current === url ? null : current)), 1800);
    } catch {
      setError("Could not copy the image URL. Select it manually instead.");
    }
  }

  async function removeMedia(item: LeadershipMediaItem) {
    if (!window.confirm(`Delete ${item.fileName}? Images already used on the website will stop loading.`)) {
      return;
    }
    setDeletingId(item.id);
    setError(null);
    try {
      await deleteLeadershipMedia({ data: { id: item.id } });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (newUpload === item.url) setNewUpload("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this image.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[55vh] max-w-6xl items-center justify-center px-4 py-20 text-center text-muted sm:px-6">
          Loading Media Library…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHero
        kicker="Command media"
        title="Media Library"
        body="Upload website images directly from your computer and reuse them across leadership portraits, company logos, backgrounds and Store products."
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
            <Link to="/leadership-store">
              <ShoppingBag className="h-4 w-4" />Store Manager
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
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Quick replace</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Main Website Images
            </h2>
          </div>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <MediaUploadField
              label="Website background"
              help="Upload a new full-site background image. Save Website Images after uploading."
              value={config.appearance.backgroundImage}
              onChange={(value) => {
                setSaved(false);
                setConfig((current) => ({
                  ...current,
                  appearance: { ...current.appearance, backgroundImage: value },
                }));
              }}
            />
            <MediaUploadField
              label="Main logo / emblem"
              help="Upload the primary 1st M.I. logo used by the header and managed emblem locations."
              value={config.appearance.logoImage}
              onChange={(value) => {
                setSaved(false);
                setConfig((current) => ({
                  ...current,
                  appearance: { ...current.appearance, logoImage: value },
                }));
              }}
              square
            />
            <div className="lg:col-span-2 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Uploading stores the image first. Saving applies the selected background/logo to the public site.
              </p>
              <div className="flex items-center gap-3">
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary">
                    <Check className="h-4 w-4" />Saved
                  </span>
                ) : null}
                <Button type="button" disabled={saving} onClick={() => void saveAppearance()}>
                  <Save className="h-4 w-4" />{saving ? "Saving…" : "Save Website Images"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 panel panel-static p-5 sm:p-6">
          <div className="mb-5">
            <p className="stencil text-[10px] tracking-[0.14em] text-primary">Upload</p>
            <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Add to Media Library
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Upload once, then copy the generated <span className="font-mono text-fg">/media/…</span> path into any existing image field in Leadership Control.
            </p>
          </div>
          <MediaUploadField
            label="New website image"
            help="JPG, PNG or WebP. Large images are automatically resized/compressed in your browser before upload."
            value={newUpload}
            onChange={setNewUpload}
            onUploaded={() => void refreshLibrary()}
          />
          {newUpload ? (
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-primary/25 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <code className="min-w-0 break-all text-xs text-primary">{newUpload}</code>
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyUrl(newUpload)}>
                {copied === newUpload ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === newUpload ? "Copied" : "Copy URL"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 panel panel-static p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="stencil text-[10px] tracking-[0.14em] text-primary">Stored media</p>
              <h2 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
                Library
              </h2>
              <p className="mt-2 text-sm text-muted">{items.length} stored image{items.length === 1 ? "" : "s"}.</p>
            </div>
            <Button type="button" variant="secondary" disabled={refreshing} onClick={() => void refreshLibrary()}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh
            </Button>
          </div>

          {items.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-black/30">
                  <div className="aspect-square overflow-hidden border-b border-border bg-black/60">
                    <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <p className="truncate font-display text-base font-semibold uppercase tracking-wide text-fg" title={item.fileName}>
                      {item.fileName}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-subtle">{formatBytes(item.sizeBytes)} · {item.mimeType.replace("image/", "").toUpperCase()}</p>
                    <code className="mt-3 block break-all rounded bg-black/45 p-2 text-[10px] leading-relaxed text-muted">
                      {item.url}
                    </code>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => void copyUrl(item.url)}>
                        {copied === item.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied === item.url ? "Copied" : "Copy"}
                      </Button>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => void removeMedia(item)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-400/25 bg-red-500/10 px-3 text-xs font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />{deletingId === item.id ? "Deleting" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border-strong bg-black/20 px-5 py-10 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-display text-xl font-semibold uppercase tracking-wide text-fg">No uploaded images yet</p>
              <p className="mt-2 text-sm text-muted">Use the upload field above to add your first image.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
