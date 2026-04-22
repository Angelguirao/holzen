import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  clampUsage,
  getFlexCreditBalance,
  getMonthlyFeatureUsage,
  startOfUtcMonthDate,
  tierFromStripePriceId,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SUBSCRIBED_STATUSES = new Set(["active", "trialing"]);

serve(
  withRequestLogging("check-subscription", async ({ req }) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const email = claimsData.claims.email as string;
    const userId = claimsData.claims.sub as string;
    if (!email) {
      return new Response(JSON.stringify({ error: "No email in token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch cached subscription data from profiles
    const { data: profile } = await serviceClient
      .from("profiles")
      .select(
        "lifetime_access, subscription_status, subscription_tier, subscription_end, subscription_checked_at",
      )
      .eq("user_id", userId)
      .single();

    // Lifetime access — always return immediately
    if (profile?.lifetime_access) {
      const limits = tierLimits("lifetime");
      const monthStart = startOfUtcMonthDate();
      const [companionsUsed, wallpapersUsed, insightsUsed, flexCreditsBalance] = await Promise.all([
        getMonthlyFeatureUsage(serviceClient, userId, "premium_companion", monthStart),
        getMonthlyFeatureUsage(serviceClient, userId, "wallpaper", monthStart),
        getMonthlyFeatureUsage(serviceClient, userId, "reflection_insights", monthStart),
        getFlexCreditBalance(serviceClient, userId),
      ]);
      const companions = clampUsage(companionsUsed, limits.premium_companion);
      const wallpapers = clampUsage(wallpapersUsed, limits.wallpaper);
      const insights = clampUsage(insightsUsed, limits.reflection_insights);
      return new Response(JSON.stringify({
        subscribed: true,
        lifetime: true,
        tier: "lifetime",
        subscription_end: null,
        monthly_companion_limit: limits.premium_companion,
        monthly_companion_used: companions.used,
        monthly_companion_remaining: companions.remaining,
        monthly_wallpaper_limit: limits.wallpaper,
        monthly_wallpaper_used: wallpapers.used,
        monthly_wallpaper_remaining: wallpapers.remaining,
        monthly_insights_limit: limits.reflection_insights,
        monthly_insights_used: insights.used,
        monthly_insights_remaining: insights.remaining,
        flex_credits_balance: flexCreditsBalance,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if cache is still fresh (unless force=true in body)
    let force = false;
    try {
      const body = await req.json();
      force = body?.force === true;
    } catch { /* no body is fine */ }

    if (!force && profile?.subscription_checked_at) {
      const checkedAt = new Date(profile.subscription_checked_at).getTime();
      const now = Date.now();
      if (now - checkedAt < CACHE_TTL_MS) {
        // Return cached result
        const cachedSubscribed = SUBSCRIBED_STATUSES.has(profile.subscription_status);
        const tier = profile.subscription_status && SUBSCRIBED_STATUSES.has(profile.subscription_status)
          ? (profile.subscription_tier === "pro_plus" ? "pro_plus" : "pro")
          : "free";
        const limits = tierLimits(tier);
        const monthStart = startOfUtcMonthDate();
        const [companionsUsed, wallpapersUsed, insightsUsed, flexCreditsBalance] = await Promise.all([
          getMonthlyFeatureUsage(serviceClient, userId, "premium_companion", monthStart),
          getMonthlyFeatureUsage(serviceClient, userId, "wallpaper", monthStart),
          getMonthlyFeatureUsage(serviceClient, userId, "reflection_insights", monthStart),
          getFlexCreditBalance(serviceClient, userId),
        ]);
        const companions = clampUsage(companionsUsed, limits.premium_companion);
        const wallpapers = clampUsage(wallpapersUsed, limits.wallpaper);
        const insights = clampUsage(insightsUsed, limits.reflection_insights);
        return new Response(JSON.stringify({
          subscribed: cachedSubscribed,
          lifetime: false,
          tier,
          subscription_end: profile.subscription_end,
          cached: true,
          monthly_companion_limit: limits.premium_companion,
          monthly_companion_used: companions.used,
          monthly_companion_remaining: companions.remaining,
          monthly_wallpaper_limit: limits.wallpaper,
          monthly_wallpaper_used: wallpapers.used,
          monthly_wallpaper_remaining: wallpapers.remaining,
          monthly_insights_limit: limits.reflection_insights,
          monthly_insights_used: insights.used,
          monthly_insights_remaining: insights.remaining,
          flex_credits_balance: flexCreditsBalance,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Cache is stale or missing — call Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });

    let hasActive = false;
    let subscriptionEnd: string | null = null;
    let subscriptionStatus = "free";
    let subscriptionTier: "free" | "pro" | "pro_plus" | "lifetime" = "free";
    let activePriceId: string | null = null;
    let trialStart: string | null = null;
    let trialEnd: string | null = null;

    const proPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? null;
    const proPlusPriceId = Deno.env.get("STRIPE_PRICE_ID_PRO_PLUS") ?? null;

    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "all",
        limit: 10,
      });

      const eligibleSub = subscriptions.data.find((sub: any) => SUBSCRIBED_STATUSES.has(sub.status));
      hasActive = Boolean(eligibleSub);

      if (eligibleSub) {
        subscriptionStatus = eligibleSub.status;
        activePriceId = eligibleSub.items?.data?.[0]?.price?.id ?? null;
        subscriptionTier = tierFromStripePriceId({
          hasActive: true,
          priceId: activePriceId,
          proPriceId,
          proPlusPriceId,
        });
        const itemEnd = eligibleSub.items?.data?.[0]?.current_period_end;
        const raw = itemEnd ?? (eligibleSub as any).current_period_end ?? eligibleSub.billing_cycle_anchor;
        try {
          if (typeof raw === "number") {
            subscriptionEnd = new Date(raw * 1000).toISOString();
          } else if (typeof raw === "string") {
            subscriptionEnd = new Date(raw).toISOString();
          }
        } catch (e) {
          console.log("Could not parse subscription end date:", raw, e);
        }
        const ts = (eligibleSub as any).trial_start;
        const te = (eligibleSub as any).trial_end;
        try {
          if (typeof ts === "number") trialStart = new Date(ts * 1000).toISOString();
        } catch { /* ignore */ }
        try {
          if (typeof te === "number") trialEnd = new Date(te * 1000).toISOString();
        } catch { /* ignore */ }
      }
    }

    // Write result to cache
    await serviceClient
      .from("profiles")
      .update({
        subscription_status: subscriptionStatus,
        subscription_tier: subscriptionTier,
        subscription_end: subscriptionEnd,
        subscription_checked_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    const limits = tierLimits(subscriptionTier);
    const monthStart = startOfUtcMonthDate();
    const [companionsUsed, wallpapersUsed, insightsUsed, flexCreditsBalance] = await Promise.all([
      getMonthlyFeatureUsage(serviceClient, userId, "premium_companion", monthStart),
      getMonthlyFeatureUsage(serviceClient, userId, "wallpaper", monthStart),
      getMonthlyFeatureUsage(serviceClient, userId, "reflection_insights", monthStart),
      getFlexCreditBalance(serviceClient, userId),
    ]);
    const companions = clampUsage(companionsUsed, limits.premium_companion);
    const wallpapers = clampUsage(wallpapersUsed, limits.wallpaper);
    const insights = clampUsage(insightsUsed, limits.reflection_insights);

    return new Response(JSON.stringify({
      subscribed: hasActive,
      lifetime: false,
      tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      cached: false,
      stripe_price_id: activePriceId,
      subscription_status: subscriptionStatus,
      trial_start: trialStart,
      trial_end: trialEnd,
      monthly_companion_limit: limits.premium_companion,
      monthly_companion_used: companions.used,
      monthly_companion_remaining: companions.remaining,
      monthly_wallpaper_limit: limits.wallpaper,
      monthly_wallpaper_used: wallpapers.used,
      monthly_wallpaper_remaining: wallpapers.remaining,
      monthly_insights_limit: limits.reflection_insights,
      monthly_insights_used: insights.used,
      monthly_insights_remaining: insights.remaining,
      flex_credits_balance: flexCreditsBalance,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
