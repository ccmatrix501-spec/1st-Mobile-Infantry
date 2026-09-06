import { createServerFn } from "@tanstack/react-start";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_IMAGE_BYTES = 2_750_000;

export type LeadershipMediaItem = {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type LeadershipImageUpload = {
  fileName: string;
  mimeType: string;
  base64: string;
};

function cleanFileName(value: string): string {
  return value.trim().replace(/[\r\n\t]/g, " ").slice(0, 180) || "uploaded-image";
}

function mediaUrl(id: string): string {
  return `/media/${encodeURIComponent(id)}`;
}

export const uploadLeadershipImage = createServerFn({ method: "POST" })
  .inputValidator((input: LeadershipImageUpload) => input)
  .handler(async ({ data }): Promise<LeadershipMediaItem> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    const profile = await requireLocalLeadership();

    const mimeType = data.mimeType.trim().toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      throw new Error("Upload a JPG, PNG or WebP image.");
    }
    if (!data.base64 || data.base64.startsWith("data:")) {
      throw new Error("The image upload payload is invalid.");
    }

    const { Buffer } = await import("node:buffer");
    const bytes = Buffer.from(data.base64, "base64");
    if (!bytes.length) throw new Error("The selected image is empty.");
    if (bytes.length > MAX_IMAGE_BYTES) {
      throw new Error("Image is too large after optimisation. Keep uploaded images under 2.75 MB.");
    }

    const { randomUUID } = await import("node:crypto");
    const id = randomUUID();
    const fileName = cleanFileName(data.fileName);
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    await sql.query(
      `insert into site_media
         (id, original_name, mime_type, data_base64, size_bytes, created_at, created_by)
       values ($1, $2, $3, $4, $5, now(), $6)`,
      [id, fileName, mimeType, data.base64, bytes.length, profile.id],
    );

    return {
      id,
      url: mediaUrl(id),
      fileName,
      mimeType,
      sizeBytes: bytes.length,
      createdAt: new Date().toISOString(),
    };
  });

export const listLeadershipMedia = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeadershipMediaItem[]> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      original_name: string;
      mime_type: string;
      size_bytes: number;
      created_at: string;
    }>(
      `select id, original_name, mime_type, size_bytes,
              created_at::text as created_at
         from site_media
        order by created_at desc
        limit 200`,
    );

    return rows.map((row) => ({
      id: row.id,
      url: mediaUrl(row.id),
      fileName: row.original_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      createdAt: row.created_at,
    }));
  },
);

export const deleteLeadershipMedia = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<boolean> => {
    const { requireLocalLeadership } = await import("@/lib/local-leadership-access.server");
    await requireLocalLeadership();
    if (!/^[a-f0-9-]{16,64}$/i.test(data.id)) throw new Error("Invalid media id.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query("delete from site_media where id = $1", [data.id]);
    return true;
  });
