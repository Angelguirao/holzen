import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(
  withRequestLogging("check-followups", async ({ req }) => {
  try {
    holzenEdgeRun("followups", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("followups", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("followups", "auth ok");
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find reflections from 24-48h ago with an outcome that don't have a follow-up yet
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Only create follow-ups for active sell/buy decisions — hold is the desired behavior
    const { data: reflections, error: refError } = await supabase
      .from("reflections")
      .select("id, user_id, outcome")
      .in("outcome", ["sold", "bought"])
      .gte("created_at", fortyEightHoursAgo)
      .lte("created_at", twentyFourHoursAgo)
      .limit(200);

    if (refError) throw refError;
    if (!reflections || reflections.length === 0) {
      holzenEdgeLog("followups", "run complete", { created: 0 });
      return new Response(JSON.stringify({ created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which ones already have follow-ups
    const reflectionIds = reflections.map((r: any) => r.id);
    const { data: existing } = await supabase
      .from("follow_ups")
      .select("reflection_id")
      .in("reflection_id", reflectionIds);

    const existingIds = new Set((existing ?? []).map((e: any) => e.reflection_id));

    // Create follow-ups for those that don't have one
    const toInsert = reflections
      .filter((r: any) => !existingIds.has(r.id))
      .map((r: any) => ({
        user_id: r.user_id,
        reflection_id: r.id,
        original_decision: r.outcome,
      }));

    if (toInsert.length === 0) {
      holzenEdgeLog("followups", "run complete", { created: 0 });
      return new Response(JSON.stringify({ created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await supabase
      .from("follow_ups")
      .insert(toInsert);

    if (insertError) throw insertError;

    holzenEdgeLog("followups", "run complete", { created: toInsert.length });

    return new Response(JSON.stringify({ created: toInsert.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    holzenEdgeError("followups", "uncaught error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  })
);
