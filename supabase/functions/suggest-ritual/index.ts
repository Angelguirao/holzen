import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(
  withRequestLogging("suggest-ritual", async ({ req, log }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const sbUser = createClient(sbUrl, sbAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await sbUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reflectionMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Feature flag + budget guard. On block, fall through to the canned template
    // already returned in the catch branch below.
    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const guard = await guardAiFeature(svcClient, "suggest_ritual", {
      userId: user.id,
      providers: ["lovable"],
    });
    if (!guard.allowed) {
      return new Response(JSON.stringify({
        steps: [{ type: "breathe" }, { type: "reflect" }, { type: "journal" }, { type: "decide" }],
        reasoning: "Fallback to standard ritual",
        blocked: guard.reason,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: profile } = await svcClient
      .from("profiles")
      .select("lifetime_access, subscription_status, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = resolveTierFromProfile(profile);
    if (tier === "free") {
      return new Response(
        JSON.stringify({
          error: "AI ritual generation is available on paid plans.",
          code: "ai_action_upgrade_required",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const limits = tierLimits(tier);
    const quota = await consumeAllowanceOrCredits(svcClient, {
      userId: user.id,
      feature: "premium_companion",
      limit: limits.premium_companion,
      amount: 1,
      reason: "companions_overage",
      source: "suggest-ritual",
    });
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: "You've used this month's AI guidance allowance.",
          code: "ai_action_quota_exceeded",
          tier,
          allowance_limit: quota.limit,
          allowance_used: quota.used,
          allowance_remaining: quota.remainingAllowance,
          credits_balance: quota.creditsBalance,
          credits_needed: Math.max(0, quota.creditCost - quota.creditsBalance),
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const logAttempt = createAttemptLogger(svcClient, { userId: user.id });
    const RITUAL_MODEL = "google/gemini-3-flash-preview";

    const prompt = `You are a wellness ritual designer for Bitcoin holders. Based on the user's current emotional state, suggest a ritual sequence.

Available step types:
- breathe: Breathing exercise (3 cycles inhale/hold/exhale)
- grounding: 5-4-3-2-1 sensory grounding exercise
- checkin: Emotional mood check-in
- reflect: Read and sit with a reflection message
- review: Review personal stats (hold rate, mood patterns)
- journal: Free-form journaling
- physical: Physical action (specify action and durationMinutes)
- decide: Final decision step (hold/sell/buy/nothing) - ALWAYS include as last step

Return a JSON object with:
- steps: array of step objects, each with "type" (required), and for physical steps also "action" (string) and "durationMinutes" (number)
- reasoning: one sentence explaining why this sequence

${reflectionMessage ? `The user's current reflection: "${reflectionMessage}"` : "No active reflection - suggest a general preparedness ritual."}

Respond ONLY with valid JSON.`;

    const t0 = Date.now();
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      fetchInitWithIncomingTrace(req, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: RITUAL_MODEL,
          messages: [{ role: "user", content: prompt }],
        }),
      }),
    );

    if (!response.ok) {
      logAttempt({
        companion_type: "suggest_ritual",
        provider: "lovable",
        model: RITUAL_MODEL,
        status: "error",
        latency_ms: Date.now() - t0,
        error_message: `HTTP ${response.status}`,
      });
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    logAttempt({
      companion_type: "suggest_ritual",
      provider: "lovable",
      model: RITUAL_MODEL,
      status: "success",
      latency_ms: Date.now() - t0,
      input_tokens: data?.usage?.prompt_tokens,
      output_tokens: data?.usage?.completion_tokens,
    });
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate steps have valid types
    const validTypes = ['breathe', 'grounding', 'checkin', 'reflect', 'review', 'journal', 'physical', 'decide'];
    const steps = (parsed.steps || []).filter((s: { type?: string }) =>
      typeof s?.type === "string" && validTypes.includes(s.type)
    );
    
    // Ensure decide is last
    if (!steps.length || steps[steps.length - 1]?.type !== 'decide') {
      steps.push({ type: 'decide' });
    }

    return new Response(JSON.stringify({ steps, reasoning: parsed.reasoning }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    try {
      log.warn("suggest_ritual_fallback", {
        holzen_event: "suggest_ritual_fallback",
        detail: e instanceof Error ? e.message : String(e),
      });
    } catch {
      /* non-fatal */
    }
    // Fallback to standard template
    return new Response(JSON.stringify({
      steps: [{ type: "breathe" }, { type: "reflect" }, { type: "journal" }, { type: "decide" }],
      reasoning: "Fallback to standard ritual",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
