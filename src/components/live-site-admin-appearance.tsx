import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { fetchPublicSiteAdminConfig } from "@/lib/site-admin-config-fn";
import type { SiteAdminConfig } from "@/lib/site-admin-config";

type Appearance = SiteAdminConfig["appearance"];

const FALLBACK_APPEARANCE: Appearance = {
  backgroundImage: "/site-bg.png",
  logoImage: "/mi-emblem.jpg",
  backgroundMode: "animated",
  backgroundSlides: [],
  backgroundIntervalSeconds: 12,
};

function safeImageUrl(value: string): string | null {
  const image = String(value || "").trim();
  if (!image || image.length > 1200) return null;
  if (image.startsWith("/") && !image.startsWith("//") && !image.includes("\\")) {
    return image;
  }
  try {
    const url = new URL(image);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function imageStyle(src: string): CSSProperties {
  return { backgroundImage: `url(${JSON.stringify(src)})` };
}

/**
 * Cinematic site-wide backdrop. A single image is subtly animated by default,
 * while Leadership can enable a rotating, crossfading image sequence.
 *
 * Only the visible and previous images are mounted to avoid eagerly loading
 * every large photo. The site's original CSS background stays as a no-JS fallback.
 */
export function LiveSiteAdminAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(FALLBACK_APPEARANCE);
  const [frame, setFrame] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicSiteAdminConfig()
      .then((config) => {
        if (!cancelled) setAppearance(config.appearance);
      })
      .catch(() => {
        // The default site art remains visible if the database is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const backgrounds = useMemo(() => {
    const urls = [appearance.backgroundImage, ...(appearance.backgroundSlides || [])]
      .map(safeImageUrl)
      .filter((url): url is string => !!url);
    return [...new Set(urls)].slice(0, 7);
  }, [appearance.backgroundImage, appearance.backgroundSlides]);

  const images = backgrounds.length ? backgrounds : ["/site-bg.png"];
  const imagesKey = images.join("|");
  const mode = appearance.backgroundMode || "animated";
  const intervalSeconds = Math.max(
    6,
    Math.min(30, Number(appearance.backgroundIntervalSeconds) || 12),
  );

  const rotate = mode === "slideshow" && images.length > 1 && !reducedMotion;
  const drift = mode !== "static" && !reducedMotion;

  useEffect(() => {
    setFrame({ index: 0, previous: null });
  }, [imagesKey, mode]);

  useEffect(() => {
    if (!rotate || !pageVisible) return;
    const timer = window.setInterval(() => {
      setFrame((current) => ({
        previous: current.index,
        index: (current.index + 1) % images.length,
      }));
    }, intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [imagesKey, images.length, intervalSeconds, pageVisible, rotate]);

  const activeIndex = rotate ? Math.min(frame.index, images.length - 1) : 0;
  const activeImage = images[activeIndex];
  const previousImage =
    rotate && frame.previous !== null && frame.previous !== activeIndex
      ? images[frame.previous]
      : null;

  return (
    <div className="site-backdrop" aria-hidden="true" data-background-mode={mode}>
      {previousImage ? (
        <div
          className="site-backdrop-image site-backdrop-drift"
          style={imageStyle(previousImage)}
        />
      ) : null}
      <div
        key={`${activeIndex}:${activeImage}`}
        className={`site-backdrop-image ${
          previousImage ? "site-backdrop-crossfade" : drift ? "site-backdrop-drift" : ""
        }`}
        style={imageStyle(activeImage)}
      />
      <div className="site-backdrop-scrim" />
      <div className="site-backdrop-grid" />
    </div>
  );
}
