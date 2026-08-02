import { createFileRoute } from "@tanstack/react-router";

const WEBHOOK_URL =
  process.env["N8N_WEBHOOK_URL"] ||
  "https://kavana.app.n8n.cloud/webhook-test/fb5ff65e-ddde-42a2-ad2b-6e57ff907d8a";

export const Route = createFileRoute("/api/campaign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        let upstream: Response;
        try {
          upstream = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
        } catch {
          return new Response(
            JSON.stringify({ error: "Could not reach the campaign webhook." }),
            { status: 502, headers: { "content-type": "application/json" } },
          );
        }
        const headers = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) headers.set("content-type", ct);
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});
