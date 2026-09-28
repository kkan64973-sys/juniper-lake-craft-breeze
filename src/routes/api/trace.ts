import { createFileRoute } from "@tanstack/react-router";
import { normalizeInputUrl } from "@/lib/redirect/ssrf";
import { trace } from "@/lib/redirect/trace";

export const Route = createFileRoute("/api/trace")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "JSONが不正です" }, { status: 400 });
        }
        const raw =
          typeof body === "object" &&
          body !== null &&
          "url" in body &&
          typeof body.url === "string"
            ? body.url
            : "";

        let normalized: string;
        try {
          normalized = normalizeInputUrl(raw);
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "URLの形式が不正です" },
            { status: 400 },
          );
        }

        try {
          const result = await trace(normalized);
          return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
        } catch (e) {
          return Response.json(
            {
              error:
                e instanceof Error ? e.message : "確認に失敗しました",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
