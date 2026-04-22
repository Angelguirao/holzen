/**
 * Shared referral attribution + milestone rewards. Used by record-referral (HTTP) and process-referral-pending (cron).
 * Idempotent: duplicate referrals / rewards are safe.
 */
import Stripe from "https://esm.sh/stripe@18.5.0";
import { sendLovableEmailMessage } from "./lovable-email.ts";

const MILESTONES = [
  { count: 1, reward: "1_week_free", trialDays: 7 },
  { count: 3, reward: "1_month_free", trialDays: 30 },
  { count: 5, reward: "lifetime", trialDays: 0 },
] as const;

const REWARD_LABELS: Record<string, string> = {
  "1_week_free": "1 week free",
  "1_month_free": "1 month free",
  lifetime: "lifetime access",
};

const logStep = (step: string, details?: unknown) => {
  const d = details !== undefined ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RECORD-REFERRAL] ${step}${d}`);
};

async function sendRewardEmail(
  email: string,
  rewardType: string,
  referralCount: number,
  referrerId: string,
) {
  if (!Deno.env.get("LOVABLE_API_KEY")) {
    logStep("LOVABLE_API_KEY not set, skipping reward email");
    return;
  }

  const rewardLabel = REWARD_LABELS[rewardType] || rewardType;
  const html = `
    <div style="font-family: monospace; max-width: 400px; margin: 0 auto; padding: 32px 16px;">
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888;">Holzen</p>
      <h2 style="font-size: 16px; margin: 24px 0 12px;">You've earned a reward</h2>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        ${referralCount} ${referralCount === 1 ? "person has" : "people have"} joined Holzen through your referral link.
      </p>
      <p style="font-size: 14px; color: #444; line-height: 1.6;">
        <strong>Your reward:</strong> ${rewardLabel}${
          rewardType === "lifetime" ? " — no more subscription needed." : " has been credited to your account."
        }
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 32px;">
        Thank you for sharing a moment of pause.
      </p>
    </div>
  `;

  // Each (referrer, reward milestone) is unique — even if the referral job
  // retries (webhook replay, cron), the same idempotency key means Lovable
  // only delivers this reward email once per 24h window.
  const result = await sendLovableEmailMessage(
    {
      from: "Holzen <notify@holzen.app>",
      to: [email],
      subject: `Holzen — You earned ${rewardLabel}`,
      html,
    },
    {
      source: "referral-reward",
      idempotencyKey: `referral-reward:${referrerId}:${rewardType}`,
      logger: {
        log: (m, d) => logStep(m, d),
        error: (m, d) => logStep(m, d),
      },
    },
  );

  if (result.ok) {
    logStep("Reward email sent", { email, rewardType, attempts: result.attempts });
  }
  // Failures are already logged by sendLovableEmailMessage via the logger above.
}

async function grantReward(
  supabase: any,
  stripe: any,
  referrerId: string,
  referrerEmail: string,
  milestone: (typeof MILESTONES)[number],
  referralCount: number,
) {
  const { data: existing } = await supabase
    .from("referral_rewards")
    .select("id")
    .eq("user_id", referrerId)
    .eq("milestone", milestone.count)
    .single();

  if (existing) {
    logStep("Reward already granted", { milestone: milestone.count });
    return;
  }

  if (milestone.reward === "lifetime") {
    await supabase
      .from("profiles")
      .update({ lifetime_access: true })
      .eq("user_id", referrerId);

    try {
      const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "active",
          limit: 1,
        });
        if (subs.data.length > 0) {
          await stripe.subscriptions.update(subs.data[0].id, {
            cancel_at_period_end: true,
            metadata: { cancelled_reason: "lifetime_referral_reward" },
          });
          logStep("Subscription set to cancel at period end for lifetime reward");
        }
      }
    } catch (e) {
      logStep("Error cancelling subscription for lifetime", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    try {
      const customers = await stripe.customers.list({ email: referrerEmail, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const creditCents = milestone.reward === "1_week_free" ? -70 : -300;
        await stripe.customers.createBalanceTransaction(customerId, {
          amount: creditCents,
          currency: "usd",
          description: `Referral reward: ${milestone.reward} (${milestone.count} referrals)`,
        });
        logStep("Applied balance credit", { creditCents, milestone: milestone.count });
      }
    } catch (e) {
      logStep("Error applying credit", { error: e instanceof Error ? e.message : String(e) });
    }
  }

  await supabase.from("referral_rewards").insert({
    user_id: referrerId,
    milestone: milestone.count,
    reward_type: milestone.reward,
  });

  logStep("Reward granted", { milestone: milestone.count, reward: milestone.reward });

  await sendRewardEmail(referrerEmail, milestone.reward, referralCount, referrerId);
}

async function grantMilestonesForReferrer(
  supabase: any,
  referrerId: string,
) {
  logStep("Referral recorded, checking milestones");

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", referrerId);

  logStep("Referrer total referrals", { count: referralCount });

  const { data: referrerAuth } = await supabase.auth.admin.getUserById(referrerId);
  const referrerEmail = referrerAuth?.user?.email;

  if (!referrerEmail || !referralCount) {
    return;
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("STRIPE_SECRET_KEY not set, skipping rewards");
    return;
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  for (const milestone of MILESTONES) {
    if (referralCount >= milestone.count) {
      await grantReward(supabase, stripe, referrerId, referrerEmail, milestone, referralCount);
    }
  }
}

export type ApplyReferralResult =
  | { ok: true }
  | { ok: false; reason: string; retryable: boolean };

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

/**
 * Ensures referral row + profile attribution exist, then runs milestone grants (idempotent).
 */
export async function applyReferralRecord(
  supabase: any,
  params: { referredUserId: string; referralCode: string },
): Promise<ApplyReferralResult> {
  const referral_code = params.referralCode.trim();
  const referredUserId = params.referredUserId;

  if (!referral_code) {
    return { ok: false, reason: "Invalid referral", retryable: false };
  }

  const { data: referrer, error: refErr } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("referral_code", referral_code)
    .maybeSingle();

  if (refErr) {
    logStep("Referrer lookup error", { error: refErr.message });
    return { ok: false, reason: refErr.message, retryable: true };
  }

  if (!referrer || referrer.user_id === referredUserId) {
    return { ok: false, reason: "Invalid referral", retryable: false };
  }

  const referrerId = referrer.user_id as string;

  const { data: existing, error: exErr } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();

  if (exErr) {
    logStep("Existing referral check error", { error: exErr.message });
    return { ok: false, reason: exErr.message, retryable: true };
  }

  if (existing) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ referred_by: referral_code })
      .eq("user_id", referredUserId);

    if (upErr) {
      logStep("Profile update error (existing referral path)", { error: upErr.message });
      return { ok: false, reason: upErr.message, retryable: true };
    }

    try {
      await grantMilestonesForReferrer(supabase, referrerId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      logStep("Milestone grant error (existing referral path)", { error: msg });
      return { ok: false, reason: msg, retryable: true };
    }

    return { ok: true };
  }

  const { error: insErr } = await supabase.from("referrals").insert({
    referrer_id: referrerId,
    referred_user_id: referredUserId,
  });

  if (insErr) {
    if (isUniqueViolation(insErr)) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ referred_by: referral_code })
        .eq("user_id", referredUserId);

      if (upErr) {
        return { ok: false, reason: upErr.message, retryable: true };
      }

      try {
        await grantMilestonesForReferrer(supabase, referrerId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, reason: msg, retryable: true };
      }

      return { ok: true };
    }

    logStep("Referral insert error", { error: insErr.message });
    return { ok: false, reason: insErr.message, retryable: true };
  }

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ referred_by: referral_code })
    .eq("user_id", referredUserId);

  if (profErr) {
    logStep("Profile update error", { error: profErr.message });
    return { ok: false, reason: profErr.message, retryable: true };
  }

  try {
    await grantMilestonesForReferrer(supabase, referrerId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logStep("Milestone grant error", { error: msg });
    return { ok: false, reason: msg, retryable: true };
  }

  return { ok: true };
}

export async function markReferralJobCompleted(supabase: any, referredUserId: string): Promise<void> {
  await supabase
    .from("referral_pending_jobs")
    .update({
      status: "completed",
      last_error: null,
      next_attempt_at: null,
    })
    .eq("referred_user_id", referredUserId)
    .in("status", ["pending", "processing"]);
}

export async function markReferralJobFailedTerminal(
  supabase: any,
  referredUserId: string,
  reason: string,
): Promise<void> {
  await supabase
    .from("referral_pending_jobs")
    .update({
      status: "failed",
      last_error: reason,
      next_attempt_at: null,
    })
    .eq("referred_user_id", referredUserId)
    .in("status", ["pending", "processing"]);
}

/** Exponential-ish backoff after an attempt completes (attempts is incremented by caller). */
export function referralBackoffMsAfterAttempt(attemptsAfterIncrement: number): number {
  const steps = [60_000, 300_000, 900_000, 3_600_000, 14_400_000];
  const idx = Math.min(Math.max(attemptsAfterIncrement - 1, 0), steps.length - 1);
  return steps[idx]!;
}
