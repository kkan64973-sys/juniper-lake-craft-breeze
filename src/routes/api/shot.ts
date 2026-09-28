import { createFileRoute } from "@tanstack/react-router";
import { normalizeInputUrl } from "@/lib/redirect/ssrf";
import { captureScreenshot } from "@/lib/redirect/screenshot";

export const Route = createFileRoute("/api/shot")({
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
          const { png, pageUrl } = await captureScreenshot(normalized);
          return new Response(new Uint8Array(png), {
            headers: {
              "Content-Type": "image/png",
              "Cache-Control": "no-store",
              "X-Page-Url": encodeURIComponent(pageUrl),
            },
          });
        } catch (e) {
          const detail = e instanceof Error ? e.message : String(e);
          const timedOut = /タイムアウト/.test(detail);
          return Response.json(
            { error: detail },
            { status: timedOut ? 504 : 502 },
          );
        }
      },
    },
  },
});
