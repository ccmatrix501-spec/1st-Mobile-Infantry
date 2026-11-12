import { ImagePlus, Images, MoveDown, MoveUp, Play, Trash2 } from "lucide-react";
import { MediaUploadField } from "@/components/media-upload-field";
import { Button } from "@/components/ui/button";
import type { SiteAdminConfig } from "@/lib/site-admin-config";

type Appearance = SiteAdminConfig["appearance"];
type BackgroundMode = Appearance["backgroundMode"];

const MAX_ADDITIONAL_SLIDES = 6;

const modes: Array<{ value: BackgroundMode; label: string; description: string }> = [
  {
    value: "static",
    label: "Still image",
    description: "Keep the current full-screen image without movement.",
  },
  {
    value: "animated",
    label: "Slow cinematic movement",
    description: "Gently pan and zoom the current image, with no image changes.",
  },
  {
    value: "slideshow",
    label: "Crossfade slideshow",
    description: "Transition between the main image and additional uploads.",
  },
];

export function SiteBackgroundEditor({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (value: Appearance) => void;
}) {
  const slides = value.backgroundSlides || [];
  const mode = value.backgroundMode || "animated";
  const intervalSeconds = value.backgroundIntervalSeconds || 12;

  function setSlide(index: number, url: string) {
    onChange({
      ...value,
      backgroundSlides: slides.map((slide, position) =>
        position === index ? url : slide,
      ),
    });
  }

  function moveSlide(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[nextIndex]] = [updated[nextIndex], updated[index]];
    onChange({ ...value, backgroundSlides: updated });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <MediaUploadField
          label="Main site background · slide 1"
          help="Upload a wide JPG, PNG or WebP (ideally 1920 × 1080 or larger). This is also the still-image fallback."
          value={value.backgroundImage}
          onChange={(backgroundImage) => onChange({ ...value, backgroundImage })}
          compact
        />
        <MediaUploadField
          label="Official unit emblem"
          help="The logo is independent of the slideshow and stays unchanged when the background rotates."
          value={value.logoImage}
          onChange={(logoImage) => onChange({ ...value, logoImage })}
          square
          compact
        />
      </div>

      <section className="rounded-xl border border-primary/25 bg-black/30 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
            <Play className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-fg">
              Background display
            </h3>
            <p className="text-xs text-muted">
              Applies across the site, with a permanent dark readability overlay.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {modes.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                mode === option.value
                  ? "border-primary/70 bg-primary/10"
                  : "border-border bg-black/30 hover:border-primary/35"
              }`}
            >
              <input
                type="radio"
                name="site-background-mode"
                value={option.value}
                checked={mode === option.value}
                onChange={() => onChange({ ...value, backgroundMode: option.value })}
                className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
              />
              <span>
                <span className="block font-display text-sm font-semibold uppercase text-fg">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {mode === "slideshow" ? (
        <section className="rounded-xl border border-border bg-black/25 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Images className="h-5 w-5" />
                <h3 className="font-display text-lg font-semibold uppercase text-fg">
                  Slideshow scenes
                </h3>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
                Your main background is always first. Add up to {MAX_ADDITIONAL_SLIDES} more
                images, then arrange them in playback order. All images remain editable.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={slides.length >= MAX_ADDITIONAL_SLIDES}
              onClick={() =>
                onChange({ ...value, backgroundSlides: [...slides, ""] })
              }
            >
              <ImagePlus className="h-4 w-4" /> Add Slide
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <label
              htmlFor="site-slide-delay"
              className="font-display text-sm font-semibold uppercase text-fg"
            >
              Time between images
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="site-slide-delay"
                type="range"
                min={6}
                max={30}
                step={1}
                value={intervalSeconds}
                onChange={(event) =>
                  onChange({
                    ...value,
                    backgroundIntervalSeconds: Number(event.target.value),
                  })
                }
                className="w-full max-w-xs accent-[var(--color-primary)]"
              />
              <output className="min-w-14 font-mono text-sm text-primary">
                {intervalSeconds}s
              </output>
            </div>
          </div>

          {slides.length > 0 ? (
            <div className="mt-5 space-y-4">
              {slides.map((url, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-black/35 p-3 sm:p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold uppercase text-fg">
                      Slide {index + 2}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={index === 0}
                        onClick={() => moveSlide(index, -1)}
                        aria-label={`Move slide ${index + 2} earlier`}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={index === slides.length - 1}
                        onClick={() => moveSlide(index, 1)}
                        aria-label={`Move slide ${index + 2} later`}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          onChange({
                            ...value,
                            backgroundSlides: slides.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                  </div>
                  <MediaUploadField
                    label={`Image for slide ${index + 2}`}
                    help="Each slide has its own upload, replacement and preview."
                    value={url}
                    onChange={(nextUrl) => setSlide(index, nextUrl)}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
              No extra scenes yet. Add another image to enable the slideshow.
              Until then, the main background uses slow cinematic movement.
            </div>
          )}
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        Click <strong>Save Site Management</strong> after changing these settings.
        Images upload to the existing Media Library immediately, but the selected
        background order and mode are saved only when you save Site Management.
        Animations pause when the tab is hidden and are disabled for visitors who
        request reduced motion.
      </p>
    </div>
  );
}
