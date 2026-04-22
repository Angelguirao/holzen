import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(
  withRequestLogging("generate-wallpaper", async ({ req }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Track AI usage + enforce feature flag / cost ceilings.
    // Wallpaper is the most expensive per-invocation AI unit in the app (image
    // generation); keep the per-user daily cap honest here.
    const svcClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: profile } = await svcClient
      .from("profiles")
      .select("lifetime_access, subscription_status, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = resolveTierFromProfile(profile);
    if (tier === "free") {
      return new Response(
        JSON.stringify({
          error: "Wallpaper generation requires an active plan.",
          code: "wallpaper_upgrade_required",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const limits = tierLimits(tier);
    const wallpaperQuota = await consumeAllowanceOrCredits(svcClient, {
      userId: user.id,
      feature: "wallpaper",
      limit: limits.wallpaper,
      amount: 1,
      reason: "wallpaper_overage",
      source: "generate-wallpaper",
    });
    if (!wallpaperQuota.allowed) {
      return new Response(
        JSON.stringify({
          error: "You've used this month's wallpaper allowance.",
          code: "wallpaper_quota_exceeded",
          tier,
          wallpaper_limit: wallpaperQuota.limit,
          wallpaper_used: wallpaperQuota.used,
          wallpaper_remaining: wallpaperQuota.remainingAllowance,
          credits_balance: wallpaperQuota.creditsBalance,
          credits_needed: Math.max(0, wallpaperQuota.creditCost - wallpaperQuota.creditsBalance),
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    try { await svcClient.from("analytics_events").insert({ user_id: user.id, event: "wallpaper_generation" }); } catch (_) { /* non-fatal */ }

    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const guard = await guardAiFeature(svcClient, "wallpaper", {
      userId: user.id,
      providers: ["lovable"],
    });
    if (!guard.allowed) {
      return new Response(JSON.stringify({ error: guard.reason ?? "Wallpaper generation paused" }), {
        status: guard.status ?? 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const logAttempt = createAttemptLogger(svcClient, { userId: user.id });
    const WALLPAPER_MODEL = "google/gemini-2.5-flash-image";

    const { message, mood, context } = await req.json();
    if (!message) throw new Error("Missing reflection message");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a rich prompt for the wallpaper
    const moodDescriptions: Record<string, string> = {
      calm: "serene, peaceful, soft blues and greens, gentle flowing water",
      anxious: "turbulent skies clearing, tension releasing, deep purples fading to amber",
      confident: "bold geometric forms, warm golden light, strong composition",
      fearful: "dark storm clouds parting to reveal light, dramatic contrast",
      neutral: "minimalist zen garden, balanced stones, muted earth tones",
      excited: "vibrant energy, dynamic shapes, warm oranges and electric blues",
    };

    const moodStyle = mood && moodDescriptions[mood] 
      ? moodDescriptions[mood] 
      : "abstract minimalist, contemplative, muted warm earth tones";

    const contextHint = context 
      ? `The market context is: ${context}. ` 
      : "";

    const prompt = `Create a beautiful, artistic phone wallpaper (portrait orientation) inspired by this personal reflection about financial composure: "${message.substring(0, 200)}". ${contextHint}Visual style: ${moodStyle}. The image should be abstract and atmospheric — no text, no words, no letters, no numbers. Think fine art photography or abstract painting. Moody, cinematic lighting. Suitable as a phone lock screen wallpaper. High quality, visually striking.`;

    const t0 = Date.now();
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: WALLPAPER_MODEL,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      logAttempt({
        companion_type: "wallpaper",
        provider: "lovable",
        model: WALLPAPER_MODEL,
        status: "error",
        latency_ms: Date.now() - t0,
        error_message: `HTTP ${response.status}`,
      });
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Failed to generate wallpaper");
    }

    const data = await response.json();
    // Wallpaper image models don't report standard prompt/completion tokens;
    // we log a fixed notional cost via input_tokens=1 so the row at least
    // lands in the per-feature totals. Calibrate with COST_MAP_OVERRIDE if
    // provider moves to a flat per-image rate you want tracked precisely.
    logAttempt({
      companion_type: "wallpaper",
      provider: "lovable",
      model: WALLPAPER_MODEL,
      status: "success",
      latency_ms: Date.now() - t0,
      input_tokens: data?.usage?.prompt_tokens,
      output_tokens: data?.usage?.completion_tokens,
    });
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image was generated");
    }

    return new Response(
      JSON.stringify({ image: imageUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-wallpaper error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  })
);
