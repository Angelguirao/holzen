import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { unknownErrorForLog } from "../_shared/log-unknown-error.ts";
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
  withRequestLogging("process-referral-pending", async ({ req, log }) => {
    try {
      log("referral_pending_phase", {
        holzen_event: "referral_pending_cron",
        phase: "handler_enter",
        method: req.method,
      });
      const { verifyServiceAuth } = await import("../_shared/auth.ts");
      if (!verifyServiceAuth(req)) {
        log.warn("referral_pending_phase", {
          holzen_event: "referral_pending_cron",
          phase: "service_auth_rejected",
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      log("referral_pending_phase", {
        holzen_event: "referral_pending_cron",
        phase: "service_auth_ok",
      });

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
        log.error("referral_pending_stale_requeue", {
          holzen_event: "referral_pending_cron",
          phase: "stale_requeue_failed",
          ...unknownErrorForLog(staleErr),
        });
        throw staleErr;
      }

      const { data: jobs, error: claimErr } = await supabase.rpc("claim_referral_pending_jobs", {
        p_limit: 15,
      });

      if (claimErr) {
        log.error("referral_pending_claim", {
          holzen_event: "referral_pending_cron",
          phase: "claim_failed",
          ...unknownErrorForLog(claimErr),
        });
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
        log("referral_pending_complete", {
          holzen_event: "referral_pending_cron",
          phase: "run_complete",
          processed: 0,
        });
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
          log,
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

          if (upErr) {
            log.error("referral_pending_job_update", {
              holzen_event: "referral_pending_cron",
              phase: "complete_update_failed",
              job_id_prefix: job.id.slice(0, 8),
              ...unknownErrorForLog(upErr),
            });
          } else ok++;
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

          if (upErr) {
            log.error("referral_pending_job_update", {
              holzen_event: "referral_pending_cron",
              phase: "failed_update_failed",
              job_id_prefix: job.id.slice(0, 8),
              ...unknownErrorForLog(upErr),
            });
          } else failed++;
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

        if (upErr) {
          log.error("referral_pending_job_update", {
            holzen_event: "referral_pending_cron",
            phase: "requeue_update_failed",
            job_id_prefix: job.id.slice(0, 8),
            ...unknownErrorForLog(upErr),
          });
        } else requeued++;
      }

      log("referral_pending_complete", {
        holzen_event: "referral_pending_cron",
        phase: "run_complete",
        claimed: list.length,
        ok,
        failed,
        requeued,
      });
      return new Response(JSON.stringify({ processed: list.length, ok, failed, requeued }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log.error("referral_pending_fatal", {
        holzen_event: "referral_pending_cron",
        phase: "fatal",
        ...unknownErrorForLog(e),
      });
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
);
