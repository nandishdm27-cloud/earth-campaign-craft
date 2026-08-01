import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const DEFAULT_WEBHOOK_URL =
  "https://kavana.app.n8n.cloud/webhook-test/fb5ff65e-ddde-42a2-ad2b-6e57ff907d8a";

const bodySchema = z.object({
  state: z.string().min(1).max(100),
  language: z.enum(["Hindi", "English"]),
  speaker: z.enum(["Male", "Female"]),
});

/**
 * Same-origin proxy for the n8n webhook. n8n does not send CORS headers, so a
 * direct browser fetch fails before the app can read the response. The upstream
 * status, content-type and body are forwarded untouched.
 */
export const Route = createFileRoute("/api/campaign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: z.infer<typeof bodySchema>;
        try {
          payload = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request payload" }, { status: 400 });
        }

        const target = process.env["N8N_WEBHOOK_URL"]?.trim() || DEFAULT_WEBHOOK_URL;

        let upstream: Response;
        try {
          upstream = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch {
          return Response.json(
            { error: "Could not reach the campaign workflow." },
            { status: 502 },
          );
        }

        const contentType = upstream.headers.get("content-type") || "application/octet-stream";
        const buffer = await upstream.arrayBuffer();
        return new Response(buffer, {
          status: upstream.status,
          headers: { "Content-Type": contentType },
        });
      },
    },
  },
});