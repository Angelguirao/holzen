import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { logDependencyCall } from "../_shared/deps.ts";
import { logAudit } from "../_shared/audit.ts";

// Deliberately keep this function simple and defensive: account deletion is irreversible.
// Observability additions here:
//   - withRequestLogging: structured request + response + Sentry on unexpected errors.
//   - logDependencyCall: Stripe calls surface in BetterStack as `dep:stripe` metrics.
//   - logAudit: one row per completed deletion — service role only, admins-only RLS.

serve(
  withRequestLogging("delete-account", async ({ req, log, cid }) => {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new EdgeError("auth_required", "Sign in to delete your account.");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData?.user) {
      throw new EdgeError("auth_required", "Session is invalid.");
    }
    const userId = userData.user.id;
    const email = userData.user.email;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ── Track what we do for the audit row. Operational metadata only; no PII contents. ──
    let cancelledSubscriptions = 0;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey && email) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        // Stripe types through esm.sh don't propagate well through generic helpers;
        // narrow to the fields we actually use.
        type StripeList<T> = { data: T[] };
        type StripeCustomer = { id: string };
        type StripeSubscription = { id: string };
        const customers = (await logDependencyCall(
          log,
          "stripe",
          () => stripe.customers.list({ email, limit: 1 }),
          { operation: "customers.list" }
        )) as StripeList<StripeCustomer>;
        if (customers.data.length > 0) {
          const subscriptions = (await logDependencyCall(
            log,
            "stripe",
            () =>
              stripe.subscriptions.list({
                customer: customers.data[0].id,
                status: "active",
                limit: 10,
              }),
            { operation: "subscriptions.list(active)" }
          )) as StripeList<StripeSubscription>;
          for (const sub of subscriptions.data) {
            await logDependencyCall(
              log,
              "stripe",
              () => stripe.subscriptions.cancel(sub.id),
              { operation: "subscriptions.cancel" }
            );
            cancelledSubscriptions++;
          }
          const trialing = (await logDependencyCall(
            log,
            "stripe",
            () =>
              stripe.subscriptions.list({
                customer: customers.data[0].id,
                status: "trialing",
                limit: 10,
              }),
            { operation: "subscriptions.list(trialing)" }
          )) as StripeList<StripeSubscription>;
          for (const sub of trialing.data) {
            await logDependencyCall(
              log,
              "stripe",
              () => stripe.subscriptions.cancel(sub.id),
              { operation: "subscriptions.cancel" }
            );
            cancelledSubscriptions++;
          }
        }
      } catch (e) {
        // We continue with deletion even if Stripe is down — the user asked to leave.
        // `logDependencyCall` already emitted a structured error log.
        log.warn("stripe_cancellation_continuing", {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Delete all user data from every table.
    // Pause V2 tables (pause_instances / pause_step_events /
    // pause_companion_events / pause_ai_artifacts) already cascade from
    // auth.users(id); explicit deletes here keep the order obvious.
    await serviceClient
      .from("collection_items")
      .delete()
      .in(
        "collection_id",
        (
          await serviceClient.from("collections").select("id").eq("user_id", userId)
        ).data?.map((c: { id: string }) => c.id) ?? []
      );

    await Promise.all([
      serviceClient.from("user_signal_preferences").delete().eq("user_id", userId),
      serviceClient.from("collections").delete().eq("user_id", userId),
      serviceClient.from("feedback").delete().eq("user_id", userId),
      serviceClient.from("analytics_events").delete().eq("user_id", userId),
      serviceClient.from("testimonials").delete().eq("user_id", userId),
      serviceClient.from("roadmap_votes").delete().eq("user_id", userId),
      serviceClient.from("push_subscriptions").delete().eq("user_id", userId),
      serviceClient.from("referral_rewards").delete().eq("user_id", userId),
      serviceClient.from("referrals").delete().eq("referrer_id", userId),
      serviceClient.from("pause_ai_artifacts").delete().eq("user_id", userId),
      serviceClient.from("pause_step_events").delete().eq("user_id", userId),
      serviceClient.from("pause_companion_events").delete().eq("user_id", userId),
      serviceClient.from("pause_instances").delete().eq("user_id", userId),
    ]);

    await serviceClient.from("profiles").delete().eq("user_id", userId);

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    log("account_deleted", { user_id: userId, cancelled_subscriptions: cancelledSubscriptions });

    // Audit is written AFTER deletion succeeds so we don't record phantom events on failure.
    // `actor_id` and `target_id` are the same because self-service deletions are initiated
    // by the owner. For admin-triggered deletions, callers must pass a different actor_id.
    await logAudit(serviceClient, {
      actor_id: userId,
      action: "account.deleted",
      target_type: "user",
      target_id: userId,
      before: null,
      after: null,
      cid,
      metadata: {
        fn: "delete-account",
        cancelled_subscriptions: cancelledSubscriptions,
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  })
);
