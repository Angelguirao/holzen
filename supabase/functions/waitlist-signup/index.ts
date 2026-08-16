import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { jsonResponse } from "../_shared/cors.ts";
import { logDependencyCall } from "../_shared/deps.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimTo(text: unknown, max: number): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

serve(
  withRequestLogging("waitlist-signup", async ({ req, log, cid }) => {
    if (req.method !== "POST") {
      throw new EdgeError("bad_input", "POST only.", 405);
    }

    const body = await req.json().catch(() => ({}));
    const emailRaw = trimTo(body?.email, 320);
    if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
      throw new EdgeError("bad_input", "Valid email required.");
    }
    const email = emailRaw.toLowerCase();
    const source = trimTo(body?.source, 64) ?? "welcome";
    const ref = trimTo(body?.ref, 128);
    const utm_source = trimTo(body?.utm_source, 64);
    const utm_medium = trimTo(body?.utm_medium, 64);
    const utm_campaign = trimTo(body?.utm_campaign, 128);
    const utm_content = trimTo(body?.utm_content, 128);
    const utm_term = trimTo(body?.utm_term, 128);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase.from("waitlist_signups").insert({
      email,
      source,
      ref,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        log("waitlist_duplicate", {
          source,
          cid,
          utm_source: utm_source ?? undefined,
        });
        return jsonResponse({ ok: true, duplicate: true });
      }
      log.error("waitlist_insert_failed", {
        code: insertError.code,
        message: insertError.message,
      });
      throw new Error(`waitlist insert failed: ${insertError.message}`);
    }

    log("waitlist_signup", {
      source,
      has_ref: Boolean(ref),
      utm_source: utm_source ?? undefined,
      utm_campaign: utm_campaign ?? undefined,
    });

    const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackWebhook) {
      // PII-safe: never include the email. Channel + cid are enough to pivot in Postgres.
      const slackLines = [
        "*Waitlist signup*",
        `source: \`${source}\``,
        utm_source ? `utm_source: \`${utm_source}\`` : null,
        utm_campaign ? `utm_campaign: \`${utm_campaign}\`` : null,
        `cid: \`${cid}\``,
      ].filter(Boolean);
      void logDependencyCall(
        log,
        "slack",
        () =>
          fetch(
            slackWebhook,
            fetchInitWithIncomingTrace(req, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: slackLines.join("\n") }),
            }),
          ),
        { operation: "incoming_webhook" },
      ).catch(() => { /* swallowed — already logged by logDependencyCall */ });
    }

    return jsonResponse({ ok: true });
  }),
);
