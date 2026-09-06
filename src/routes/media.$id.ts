import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!/^[a-f0-9-]{16,64}$/i.test(id)) {
          return new Response("Not found", { status: 404 });
        }

        try {
          const { getSql } = await import("@/lib/db");
          const sql = await getSql();
          const rows = await sql.query<{
            mime_type: string;
            data_base64: string;
            size_bytes: number;
          }>(
            "select mime_type, data_base64, size_bytes from site_media where id = $1 limit 1",
            [id],
          );
          const row = rows[0];
          if (!row) return new Response("Not found", { status: 404 });

          const { Buffer } = await import("node:buffer");
          const body = Buffer.from(row.data_base64, "base64");
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": row.mime_type,
              "Content-Length": String(body.length),
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Content-Type-Options": "nosniff",
              ETag: `\"${id}\"`,
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
