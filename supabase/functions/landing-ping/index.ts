import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { jsonResponse } from "../_shared/cors.ts";

serve(
  withRequestLogging("landing-ping", async ({ req, log }) => {
    if (req.method !== "POST") {
      throw new EdgeError("bad_input", "POST only.", 405);
    }

    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path.slice(0, 200) : "/";
    if (path !== "/" && path !== "/welcome") {
      throw new EdgeError("bad_input", "Unsupported path.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const day = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.rpc("increment_landing_views", { p_day: day });
    if (error) {
      log.error("landing_ping_failed", { message: error.message });
      throw new Error(`landing ping failed: ${error.message}`);
    }

    return jsonResponse({ ok: true });
  }),
);
