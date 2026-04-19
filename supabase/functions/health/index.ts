// Public health endpoint used by UptimeRobot (and `curl` for smoke tests).
//
// Deliberately minimal:
//   - No auth: UptimeRobot hits this from many IPs without credentials, and the `[functions.health]`
//     block in supabase/config.toml must set `verify_jwt = false`.
//   - Returns JSON (not HTML) so tests can assert on the body.
//   - Includes `release` + `environment` so a 200 also doubles as a release-is-live signal.
//   - Included in the observability rollout as a third representative function alongside
//     `journal-prompt` and `send-feedback` — see docs/ops/edge-logging-conventions.md.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

serve(
  withRequestLogging("health", async ({ cid }) => {
    const body = {
      ok: true,
      service: "holzen-edge",
      release: Deno.env.get("SENTRY_RELEASE") ?? Deno.env.get("APP_VERSION") ?? "unknown",
      environment: Deno.env.get("SENTRY_ENVIRONMENT") ?? "production",
      cid,
      ts: new Date().toISOString(),
    };
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    });
  })
);
