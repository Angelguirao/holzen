import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  applyReferralRecord,
  referralBackoffMsAfterAttempt,
} from "../_shared/referral-record-core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STALE_PROCESSING_MS = 15 * 60 * 1000;

serve(
  withRequestLogging("process-referral-pending", async ({ req }) => {
  try {
    holzenEdgeRun("referral-pending", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("referral-pending", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("referral-pending", "auth ok");

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
    const { error: staleErr } = await supabase
      .from("referral_pending_jobs")
      .update({
        status: "pending",
        last_error: "stale_processing_requeued",
      })
      .eq("status", "processing")
      .lt("updated_at", staleBefore);

    if (staleErr) {
      holzenEdgeError("referral-pending", "stale requeue failed", staleErr);
      throw staleErr;
    }

    const { data: jobs, error: claimErr } = await supabase.rpc("claim_referral_pending_jobs", {
      p_limit: 15,
    });

    if (claimErr) {
      holzenEdgeError("referral-pending", "claim failed", claimErr);
      throw claimErr;
    }

    const list = (jobs ?? []) as Array<{
      id: string;
      referred_user_id: string;
      referral_code: string;
      attempts: number;
      max_attempts: number;
    }>;

    if (list.length === 0) {
      holzenEdgeLog("referral-pending", "run complete", { processed: 0 });
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ok = 0;
    let failed = 0;
    let requeued = 0;

    for (const job of list) {
      const nextAttempts = job.attempts + 1;
      const result = await applyReferralRecord(supabase, {
        referredUserId: job.referred_user_id,
        referralCode: job.referral_code,
      });

      if (result.ok) {
        const { error: upErr } = await supabase
          .from("referral_pending_jobs")
          .update({
            status: "completed",
            attempts: nextAttempts,
            last_error: null,
            next_attempt_at: null,
          })
          .eq("id", job.id);

        if (upErr) holzenEdgeError("referral-pending", "complete update failed", upErr);
        else ok++;
        continue;
      }

      if (!result.retryable || nextAttempts >= job.max_attempts) {
        const { error: upErr } = await supabase
          .from("referral_pending_jobs")
          .update({
            status: "failed",
            attempts: nextAttempts,
            last_error: result.reason,
            next_attempt_at: null,
          })
          .eq("id", job.id);

        if (upErr) holzenEdgeError("referral-pending", "failed update failed", upErr);
        else failed++;
        continue;
      }

      const backoff = referralBackoffMsAfterAttempt(nextAttempts);
      const { error: upErr } = await supabase
        .from("referral_pending_jobs")
        .update({
          status: "pending",
          attempts: nextAttempts,
          last_error: result.reason,
          next_attempt_at: new Date(Date.now() + backoff).toISOString(),
        })
        .eq("id", job.id);

      if (upErr) holzenEdgeError("referral-pending", "requeue update failed", upErr);
      else requeued++;
    }

    holzenEdgeLog("referral-pending", "run complete", { claimed: list.length, ok, failed, requeued });
    return new Response(JSON.stringify({ processed: list.length, ok, failed, requeued }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("referral-pending", "fatal", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
