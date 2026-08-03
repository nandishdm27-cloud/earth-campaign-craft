import { createFileRoute } from "@tanstack/react-router";

const N8N_WEBHOOK_URL =
  "https://kavana.app.n8n.cloud/webhook-test/fb5ff65e-ddde-42a2-ad2b-6e57ff907d8a";

export const Route = createFileRoute("/api/campaign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const target = process.env["N8N_WEBHOOK_URL"] || N8N_WEBHOOK_URL;

        let upstream: Response;
        try {
          upstream = await fetch(target, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
        } catch {
          return new Response(
            JSON.stringify({ error: "Could not reach the campaign service." }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }

        const contentType = upstream.headers.get("content-type") || "application/json";
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "Content-Type": contentType },
        });
      },
    },
  },
});
