import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { logDependencyCall } from "../_shared/deps.ts";
import { sendLovableEmailMessage } from "../_shared/lovable-email.ts";

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const CATEGORY_EMOJI: Record<string, string> = {
  bug: "🐛",
  feature: "💡",
  question: "❓",
};

const VALID_CATEGORIES = new Set(["bug", "feature", "question"]);

/** Trim + hard-cap incoming text so no single column blows up (defense in depth). */
function trimTo(text: unknown, max: number): string | null {
  if (typeof text !== "string") return null;
  const t = text.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

serve(
  withRequestLogging("send-feedback", async ({ req, log, cid }) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new EdgeError("auth_required", "Sign in to send feedback.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new EdgeError("auth_required", "Sign in to send feedback.");

    // Accept legacy (`{ category, message }`) and enriched shape (everything from FeedbackWidget).
    const body = await req.json().catch(() => ({}));
    const category = body?.category;
    const message = trimTo(body?.message, 4000);
    if (!message) throw new EdgeError("bad_input", "Message is required.");
    if (!VALID_CATEGORIES.has(category)) {
      throw new EdgeError("bad_input", "Invalid category.");
    }

    // The new columns land in the 20260419160000 migration. They are all nullable so the
    // insert still works against older schemas (though Postgres will error instead of silently
    // ignoring unknown columns — after migration apply, this is fine).
    const enrichment = {
      page: trimTo(body?.page, 500),
      user_agent: trimTo(body?.user_agent, 500),
      sentry_event_id: trimTo(body?.sentry_event_id, 100),
      posthog_session_id: trimTo(body?.posthog_session_id, 100),
      cid, // from the request context — authoritative, not the client-provided copy
      error_stack: trimTo(body?.error_stack, 2000),
      app_version: trimTo(body?.app_version, 50),
    };

    const { error: insertError } = await supabase
      .from("feedback")
      .insert({ user_id: user.id, category, message, ...enrichment });
    if (insertError) {
      log.error("feedback_insert_failed", {
        code: insertError.code,
        message: insertError.message,
      });
      throw new Error(`feedback insert failed: ${insertError.message}`);
    }

    log("feedback_saved", {
      category,
      has_sentry: !!enrichment.sentry_event_id,
      has_error_stack: !!enrichment.error_stack,
    });

    // Two fire-and-forget notifications: the ops Slack channel and the Lovable email.
    // Both are best-effort — we've already confirmed success to the client via the row insert.

    const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackWebhook) {
      // PII-safe: never include the message body, email, or error_stack.
      // The Slack payload is a pivot anchor: link out to Sentry/BetterStack via cid + sentry_event_id.
      const slackLines = [
        `${CATEGORY_EMOJI[category] ?? ""} *New feedback* · category: \`${category}\``,
        `user: \`${user.id}\``,
        `cid: \`${cid}\``,
        enrichment.sentry_event_id ? `sentry: \`${enrichment.sentry_event_id}\`` : null,
        enrichment.page ? `page: \`${enrichment.page}\`` : null,
        enrichment.app_version ? `version: \`${enrichment.app_version}\`` : null,
      ].filter(Boolean);
      void logDependencyCall(
        log,
        "slack",
        () =>
          fetch(slackWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: slackLines.join("\n") }),
          }),
        { operation: "incoming_webhook" }
      ).catch(() => { /* swallowed — already logged by logDependencyCall */ });
    }

    if (Deno.env.get("LOVABLE_API_KEY")) {
      const html = `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: 14px; color: #666;">New Feedback</h2>
          <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 4px 8px; color: #999;">Category</td><td style="padding: 4px 8px;">${escapeHtml(category)}</td></tr>
            <tr><td style="padding: 4px 8px; color: #999;">User</td><td style="padding: 4px 8px;">${escapeHtml(user.email || "")}</td></tr>
            <tr><td style="padding: 4px 8px; color: #999;">User ID</td><td style="padding: 4px 8px; font-size: 11px;">${escapeHtml(user.id)}</td></tr>
            <tr><td style="padding: 4px 8px; color: #999;">CID</td><td style="padding: 4px 8px; font-size: 11px;">${escapeHtml(cid)}</td></tr>
            ${enrichment.sentry_event_id ? `<tr><td style="padding: 4px 8px; color: #999;">Sentry</td><td style="padding: 4px 8px; font-size: 11px;">${escapeHtml(enrichment.sentry_event_id)}</td></tr>` : ""}
            ${enrichment.page ? `<tr><td style="padding: 4px 8px; color: #999;">Page</td><td style="padding: 4px 8px; font-size: 11px;">${escapeHtml(enrichment.page)}</td></tr>` : ""}
            ${enrichment.app_version ? `<tr><td style="padding: 4px 8px; color: #999;">Version</td><td style="padding: 4px 8px; font-size: 11px;">${escapeHtml(enrichment.app_version)}</td></tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; white-space: pre-wrap;">${escapeHtml(message)}</div>
          ${enrichment.error_stack ? `<pre style="margin-top: 12px; padding: 12px; background: #fff8f0; border-radius: 6px; font-size: 11px; overflow:auto; max-height:320px;">${escapeHtml(enrichment.error_stack)}</pre>` : ""}
        </div>
      `;

      // Fire-and-forget: the Lovable helper retries on 429/5xx internally and
      // uses `cid` as an idempotency key so any duplicate POST from the
      // browser is de-duped by Lovable inside the 24h window.
      void sendLovableEmailMessage(
        {
          from: "Holzen Feedback <notify@notify.holzen.app>",
          to: ["hello@holzen.app"],
          subject: `${CATEGORY_EMOJI[category] || ""} [${category.toUpperCase()}] New feedback from ${escapeHtml(user.email || "")}`,
          html,
        },
        {
          source: "send-feedback",
          idempotencyKey: `send-feedback:${cid}`,
          logger: { log: (m, d) => log(m, d), error: (m, d) => log.error(m, d) },
        },
      ).catch(() => { /* already logged by sendLovableEmailMessage */ });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  })
);
