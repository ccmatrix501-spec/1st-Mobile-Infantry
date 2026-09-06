import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadLeadershipImage } from "@/lib/media-fn";

const inputClass =
  "h-11 w-full rounded-md border border-border-strong bg-black/45 px-3 text-sm text-fg outline-none transition-colors focus:border-primary/70";

async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("Could not encode the selected image."));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(file);
  });
}

async function optimiseImage(file: File): Promise<{ blob: Blob; mimeType: string; fileName: string }> {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 20_000_000) throw new Error("Choose an image smaller than 20 MB.");

  if (file.size <= 2_300_000) {
    return { blob: file, mimeType: file.type, fileName: file.name };
  }

  const bitmap = await createImageBitmap(file);
  try {
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Your browser could not prepare this image.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Could not optimise this image."))),
        "image/webp",
        0.82,
      );
    });
    if (blob.size > 2_750_000) {
      throw new Error("This image is still too large after optimisation. Try a smaller image.");
    }
    return {
      blob,
      mimeType: "image/webp",
      fileName: file.name.replace(/\.[^.]+$/, "") + ".webp",
    };
  } finally {
    bitmap.close();
  }
}

export function MediaUploadField({
  label,
  help,
  value,
  onChange,
  onUploaded,
  square,
  compact,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  onUploaded?: (url: string) => void;
  square?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const prepared = await optimiseImage(file);
      const base64 = await fileToBase64(prepared.blob);
      const uploaded = await uploadLeadershipImage({
        data: {
          fileName: prepared.fileName,
          mimeType: prepared.mimeType,
          base64,
        },
      });
      onChange(uploaded.url);
      onUploaded?.(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-md border border-border bg-black/20 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
          <ImagePlus className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-fg">{label}</p>
          {help ? <p className="mt-1 text-xs leading-relaxed text-muted">{help}</p> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/media/... or https://..."
          className={inputClass}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload Image"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}

      {value ? (
        <div className="mt-4 overflow-hidden rounded-md border border-border bg-black/50">
          <img
            src={value}
            alt={`${label} preview`}
            className={
              square
                ? "h-36 w-36 object-cover"
                : compact
                  ? "h-36 w-full object-cover"
                  : "max-h-72 w-full object-cover"
            }
          />
        </div>
      ) : null}
    </div>
  );
}
