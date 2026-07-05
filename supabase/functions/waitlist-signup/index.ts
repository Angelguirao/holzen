import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { jsonResponse } from "../_shared/cors.ts";

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase.from("waitlist_signups").insert({
      email,
      source,
      ref,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        log("waitlist_duplicate", { source, cid });
        return jsonResponse({ ok: true, duplicate: true });
      }
      log.error("waitlist_insert_failed", {
        code: insertError.code,
        message: insertError.message,
      });
      throw new Error(`waitlist insert failed: ${insertError.message}`);
    }

    log("waitlist_signup", { source, has_ref: Boolean(ref) });
    return jsonResponse({ ok: true });
  }),
);
