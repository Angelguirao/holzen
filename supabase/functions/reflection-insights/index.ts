import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
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

/** Call AI with automatic model fallback: try primary, on failure retry with fallback model */
async function callAIWithFallback(
  apiKey: string,
  body: Record<string, unknown>,
  primaryModel: string,
  fallbackModel: string,
  timeoutMs = 18000,
): Promise<{ data: any; status: number }> {
  for (const model of [primaryModel, fallbackModel]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, model }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429 || res.status === 402) {
        return { data: null, status: res.status };
      }
      if (!res.ok) {
        const t = await res.text();
        console.error(`[AI ${model}] error ${res.status}: ${t}`);
        if (model === fallbackModel) return { data: null, status: res.status };
        console.log(`[AI] Retrying with fallback model ${fallbackModel}`);
        continue;
      }
      const data = await res.json();
      return { data, status: 200 };
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        console.warn(`[AI ${model}] timed out after ${timeoutMs}ms`);
        if (model === fallbackModel) return { data: null, status: 504 };
        console.log(`[AI] Retrying with fallback model ${fallbackModel}`);
        continue;
      }
      throw e;
    }
  }
  return { data: null, status: 500 };
}

serve(
  withRequestLogging("reflection-insights", async ({ req }) => {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Feature flag + global budget guard. On block, return a 503 (cron retries
    // tomorrow; user-triggered calls show a retry-later toast).
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const riGuard = await guardAiFeature(supabase, "reflection_insights", {
      providers: ["lovable"],
    });
    if (!riGuard.allowed) {
      return new Response(
        JSON.stringify({ error: riGuard.reason ?? "Temporarily unavailable", processed: 0 }),
        { status: riGuard.status ?? 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const singleUserId = body.user_id as string | undefined;
    const bodyLanguage = body.language as string | undefined;

    holzenEdgeRun("reflection-insights", "request", {
      method: req.method,
      mode: singleUserId ? "user" : "batch",
    });

    const authHeader = req.headers.get("Authorization");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    let userIds: string[] = [];

    if (singleUserId) {
      if (!authHeader?.startsWith("Bearer ")) {
        holzenEdgeRun("reflection-insights", "user auth rejected", { reason: "no_bearer" });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonClient = createClient(sbUrl, sbAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await anonClient.auth.getUser();
      if (userErr || !user || user.id !== singleUserId) {
        holzenEdgeRun("reflection-insights", "user auth rejected", { reason: "jwt_mismatch" });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userIds = [singleUserId];
    } else {
      const { verifyServiceAuth } = await import("../_shared/auth.ts");
      if (!verifyServiceAuth(req)) {
        holzenEdgeRun("reflection-insights", "auth rejected");
        return new Response(
          JSON.stringify({
            error: "Unauthorized. Batch mode requires Authorization: Bearer with service role or CRON_SECRET.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      holzenEdgeRun("reflection-insights", "auth ok");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, quiet_hours_start, quiet_hours_end, timezone, ai_insights_enabled, language");

      const eligibleProfiles = (profiles ?? []).filter((p: any) => {
        if (p.ai_insights_enabled === false) return false;
        if (p.quiet_hours_start == null || p.quiet_hours_end == null) return true;
        const tz = p.timezone || "UTC";
        let nowHour: number;
        try {
          nowHour = parseInt(
            new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false })
          );
        } catch {
          nowHour = new Date().getUTCHours();
        }
        const start = p.quiet_hours_start;
        const end = p.quiet_hours_end;
        if (start <= end) {
          return !(nowHour >= start && nowHour < end);
        }
        return !(nowHour >= start || nowHour < end);
      });
      userIds = eligibleProfiles.map((p: any) => p.user_id);
    }

    let generated = 0;

    for (const userId of userIds) {
      try { await supabase.from("analytics_events").insert({ user_id: userId, event: "reflection_insights_ai_call" }); } catch (_) { /* non-fatal */ }
      let userLanguage = bodyLanguage || "en";
      if (!bodyLanguage && !singleUserId) {
        const prof = (await supabase.from("profiles").select("language").eq("user_id", userId).single()).data;
        userLanguage = (prof as any)?.language || "en";
      }

      const { data: reflections, error: refError } = await supabase
        .from("v_reflection_with_companions")
        .select("message, context, mood, mood_after, outcome, tags, created_at, breathing_completed, haiku_read, grounding_read, companion_signal_read, companion_zoom_out_read, companion_history_read, note")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (refError || !reflections || reflections.length < 5) continue;

      if (singleUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("lifetime_access, subscription_status, subscription_tier")
          .eq("user_id", userId)
          .maybeSingle();
        const tier = resolveTierFromProfile(profile);
        if (tier === "free") {
          return new Response(
            JSON.stringify({
              error: "AI insights are available on paid plans.",
              code: "insights_upgrade_required",
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const limits = tierLimits(tier);
        const quota = await consumeAllowanceOrCredits(supabase, {
          userId,
          feature: "reflection_insights",
          limit: limits.reflection_insights,
          amount: 1,
          reason: "insights_overage",
          source: "reflection-insights",
        });
        if (!quota.allowed) {
          return new Response(
            JSON.stringify({
              error: "You've used this month's insights allowance.",
              code: "insights_quota_exceeded",
              tier,
              insights_limit: quota.limit,
              insights_used: quota.used,
              insights_remaining: quota.remainingAllowance,
              credits_balance: quota.creditsBalance,
              credits_needed: Math.max(0, quota.creditCost - quota.creditsBalance),
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // Build skill-oriented summary
      const summary = reflections.map((r: any) => {
        const date = new Date(r.created_at);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const hour = date.getHours();
        const volMatch = r.context?.match(/[↑↓](\d+(?:\.\d+)?)%/);
        const volatility = volMatch ? parseFloat(volMatch[1]) : 0;

        const skills: string[] = [];
        if (r.mood_after && r.mood) {
          const COMPOSURE: Record<string, number> = { fomo: 10, greedy: 15, anxious: 20, fearful: 25, excited: 40, uncertain: 50, detached: 75, calm: 100 };
          if ((COMPOSURE[r.mood_after] ?? 50) > (COMPOSURE[r.mood] ?? 50)) skills.push("regulation");
        }
        if (r.breathing_completed && !skills.includes("regulation")) skills.push("regulation");
        if (volatility >= 3 && (r.outcome === "held" || r.outcome === "nothing")) skills.push("tolerance");
        if (r.outcome === "held" || r.outcome === "nothing") skills.push("alignment");
        if (r.companion_zoom_out_read || r.companion_history_read || r.companion_signal_read || r.grounding_read) skills.push("reappraisal");
        if ((r.note && r.note.length > 10) || (r.tags && r.tags.length > 0)) skills.push("awareness");

        return {
          day: dayName, hour, date: r.created_at.slice(0, 10),
          mood: r.mood || "none", mood_after: r.mood_after || "none",
          outcome: r.outcome || "none", volatility, skills,
          tools: [r.breathing_completed && "breathing", r.companion_zoom_out_read && "zoom_out", r.companion_history_read && "history", r.companion_signal_read && "signal", r.grounding_read && "grounding"].filter(Boolean),
          hasNote: !!(r.note && r.note.length > 10), tagCount: r.tags?.length || 0,
        };
      });

      const skillCounts: Record<string, number> = { regulation: 0, tolerance: 0, alignment: 0, reappraisal: 0, awareness: 0 };
      for (const s of summary) {
        for (const skill of s.skills) {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        }
      }

      const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
      const langName = LANG_NAMES[userLanguage] || "English";
      const langInstruction = userLanguage !== "en" ? `\n\nLANGUAGE: Write all insight titles and bodies in ${langName}.` : "";

      const systemPrompt = `You are a skill development analyst for Holzen, a Bitcoin composure app. Users build 5 skills through pause sessions during BTC volatility:

1. EMOTIONAL REGULATION — shifting from reactive to composed states (mood→mood_after improvement, breathing)
2. DISTRESS TOLERANCE — holding steady during high volatility (≥3% change) without impulsive action
3. DECISION ALIGNMENT — making choices consistent with their hold goals
4. COGNITIVE REAPPRAISAL — engaging perspective-shifting tools (zoom out, history, signals, grounding research) especially during volatile moments
5. SELF-AWARENESS — depth of reflection through notes, tags, and pattern recognition

Analyze the user's data through this skill lens. Generate 3-5 insights about their SKILL DEVELOPMENT — not mood patterns or generic advice.

Each insight must have these JSON keys:
- "category": one of "regulation", "tolerance", "alignment", "reappraisal", "awareness"
- "title": Short headline (5-10 words)
- "body": 1-2 sentence insight about skill development based on actual data patterns
- "sentiment": one of "positive", "neutral", "actionable"

Return a JSON object with a single key "insights" containing an array of these objects.${langInstruction}`;

      const userPrompt = `Here is the user's skill data (${reflections.length} total pauses):

Skill frequency (out of ${reflections.length} pauses):
${JSON.stringify(skillCounts)}

Recent pauses with skill tags (newest first):
${JSON.stringify(summary.slice(0, 50), null, 0)}

Generate 3-5 skill development insights based on real patterns in this data. Return JSON only.`;

      const { data: aiData, status } = await callAIWithFallback(
        LOVABLE_API_KEY,
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        },
        "google/gemini-3-flash-preview",
        "google/gemini-2.5-flash-lite",
        20000,
      );

      if (status === 429 || status === 402) {
        console.error(`[INSIGHTS] Rate limited or credits exhausted for user ${userId}`);
        continue;
      }
      if (!aiData) {
        console.error(`[INSIGHTS] AI failed for user ${userId} with status ${status}`);
        continue;
      }

      const raw = aiData.choices?.[0]?.message?.content || "";
      let insights: any[];
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        insights = parsed.insights || parsed;
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) { console.error("[INSIGHTS] Failed to parse AI JSON"); continue; }
        const parsed = JSON.parse(m[0]);
        insights = parsed.insights || parsed;
      }

      if (!insights || !Array.isArray(insights)) continue;

      await supabase.from("reflection_insights").insert({
        user_id: userId,
        insights,
        reflection_count: reflections.length,
        period_start: reflections[reflections.length - 1].created_at,
        period_end: reflections[0].created_at,
        generated_at: new Date().toISOString(),
        language: userLanguage,
      });

      generated++;
    }

    holzenEdgeLog("reflection-insights", "run complete", { generated, mode: singleUserId ? "user" : "batch" });
    return new Response(JSON.stringify({ generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("reflection-insights", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
