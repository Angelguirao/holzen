import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { unknownErrorForLog } from "../_shared/log-unknown-error.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { createLogger } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";
import { AI_TEMPORARILY_UNAVAILABLE_MESSAGE } from "../_shared/ai-user-messages.ts";

type RequestLog = ReturnType<typeof createLogger>;

/** Batch-mode profile row for quiet-hour gating. */
interface InsightsEligibleProfile {
  user_id: string;
  quiet_hours_start?: number | null;
  quiet_hours_end?: number | null;
  timezone?: string | null;
  ai_insights_enabled?: boolean | null;
  language?: string | null;
}

/** v_pause_full projection used for skill summary. */
interface PauseRowForInsights {
  created_at: string;
  context_snapshot?: { change_24h_pct?: number; change_7d_pct?: number } | null;
  initial_mood?: string | null;
  shift_mood?: string | null;
  outcome?: string | null;
  counted_companion_types?: string[] | null;
  has_breath_completed?: boolean | null;
  note_text?: string | null;
  tags?: string[] | null;
}

interface LovableChatCompletion {
  choices?: Array<{ message?: { content?: string } }>;
}

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
  timeoutMs: number,
  log: RequestLog,
  incoming?: Request,
): Promise<{ data: unknown; status: number }> {
  for (const model of [primaryModel, fallbackModel]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        fetchInitWithIncomingTrace(incoming, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...body, model }),
          signal: controller.signal,
        }),
      );
      clearTimeout(timeout);

      if (res.status === 429 || res.status === 402) {
        return { data: null, status: res.status };
      }
      if (!res.ok) {
        const t = await res.text();
        try {
          log.error("reflection_insights_ai_upstream_error", {
            holzen_event: "reflection_insights_ai_upstream_error",
            model,
            status: res.status,
            response_chars: t.length,
          });
        } catch {
          /* non-fatal */
        }
        if (model === fallbackModel) return { data: null, status: res.status };
        try {
          log("reflection_insights_model_retry", {
            holzen_event: "reflection_insights_model_retry",
            reason: "http_not_ok",
            from_model: model,
            to_model: fallbackModel,
          });
        } catch {
          /* non-fatal */
        }
        continue;
      }
      const data = await res.json();
      return { data, status: 200 };
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        try {
          log.warn("reflection_insights_ai_timeout", {
            holzen_event: "reflection_insights_ai_timeout",
            model,
            timeout_ms: timeoutMs,
          });
        } catch {
          /* non-fatal */
        }
        if (model === fallbackModel) return { data: null, status: 504 };
        try {
          log("reflection_insights_model_retry", {
            holzen_event: "reflection_insights_model_retry",
            reason: "timeout",
            from_model: model,
            to_model: fallbackModel,
          });
        } catch {
          /* non-fatal */
        }
        continue;
      }
      throw e;
    }
  }
  return { data: null, status: 500 };
}

serve(
  withRequestLogging("reflection-insights", async ({ req, log }) => {
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
      log("reflection_insights_phase", {
        holzen_event: "reflection_insights_cron",
        phase: "guard_blocked",
        reason: riGuard.reason ?? "unknown",
        tripped: riGuard.tripped ?? null,
      });
      return new Response(
        JSON.stringify({ error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE, processed: 0 }),
        { status: riGuard.status ?? 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const singleUserId = body.user_id as string | undefined;
    const bodyLanguage = body.language as string | undefined;

    log("reflection_insights_phase", {
      holzen_event: "reflection_insights_cron",
      phase: "request",
      method: req.method,
      mode: singleUserId ? "user" : "batch",
    });

    const authHeader = req.headers.get("Authorization");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    let userIds: string[] = [];

    if (singleUserId) {
      if (!authHeader?.startsWith("Bearer ")) {
        log.warn("reflection_insights_phase", {
          holzen_event: "reflection_insights_cron",
          phase: "user_auth_rejected",
          reason: "no_bearer",
        });
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
        log.warn("reflection_insights_phase", {
          holzen_event: "reflection_insights_cron",
          phase: "user_auth_rejected",
          reason: "jwt_mismatch",
        });
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userIds = [singleUserId];
    } else {
      const { verifyServiceAuth } = await import("../_shared/auth.ts");
      if (!verifyServiceAuth(req)) {
        log.warn("reflection_insights_phase", {
          holzen_event: "reflection_insights_cron",
          phase: "service_auth_rejected",
        });
        return new Response(
          JSON.stringify({
            error: "Unauthorized. Batch mode requires Authorization: Bearer with service role or CRON_SECRET.",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      log("reflection_insights_phase", {
        holzen_event: "reflection_insights_cron",
        phase: "service_auth_ok",
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, quiet_hours_start, quiet_hours_end, timezone, ai_insights_enabled, language");

      const eligibleProfiles = ((profiles ?? []) as InsightsEligibleProfile[]).filter((p) => {
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
      userIds = eligibleProfiles.map((p) => p.user_id);
    }

    let generated = 0;

    for (const userId of userIds) {
      try { await supabase.from("analytics_events").insert({ user_id: userId, event: "reflection_insights_ai_call" }); } catch (_) { /* non-fatal */ }
      let userLanguage = bodyLanguage || "en";
      if (!bodyLanguage && !singleUserId) {
        const { data: prof } = await supabase.from("profiles").select("language").eq("user_id", userId).single();
        userLanguage = (prof as { language?: string } | null)?.language || "en";
      }

      const { data: pauseRows, error: pauseReadError } = await supabase
        .from("v_pause_full")
        .select(
          "reflection_text, context_snapshot, initial_mood, shift_mood, outcome, tags, created_at, has_breath_completed, counted_companion_types, note_text",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (pauseReadError || !pauseRows || pauseRows.length < 5) continue;

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
      const summary = (pauseRows as PauseRowForInsights[]).map((r) => {
        const date = new Date(r.created_at);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const hour = date.getHours();
        const ctxPct = Number(r.context_snapshot?.change_24h_pct ?? r.context_snapshot?.change_7d_pct ?? 0);
        const volatility = Number.isFinite(ctxPct) ? Math.abs(ctxPct) : 0;
        const countedTypes: string[] = Array.isArray(r.counted_companion_types)
          ? r.counted_companion_types
          : [];

        const skills: string[] = [];
        if (r.shift_mood && r.initial_mood) {
          const COMPOSURE: Record<string, number> = { fomo: 10, greedy: 15, anxious: 20, fearful: 25, excited: 40, uncertain: 50, detached: 75, calm: 100 };
          if ((COMPOSURE[r.shift_mood] ?? 50) > (COMPOSURE[r.initial_mood] ?? 50)) skills.push("regulation");
        }
        if (r.has_breath_completed && !skills.includes("regulation")) skills.push("regulation");
        if (volatility >= 3 && (r.outcome === "held" || r.outcome === "nothing")) skills.push("tolerance");
        if (r.outcome === "held" || r.outcome === "nothing") skills.push("alignment");
        if (
          countedTypes.includes("zoom_out") ||
          countedTypes.includes("zoom_out_deep_time") ||
          countedTypes.includes("historical_insight") ||
          countedTypes.includes("signal") ||
          countedTypes.includes("ground_nudge")
        )
          skills.push("reappraisal");
        if ((r.note_text && r.note_text.length > 10) || (r.tags && r.tags.length > 0)) skills.push("awareness");

        return {
          day: dayName,
          hour,
          date: r.created_at.slice(0, 10),
          mood: r.initial_mood || "none",
          mood_after: r.shift_mood || "none",
          outcome: r.outcome || "none",
          volatility,
          skills,
          tools: [
            r.has_breath_completed && "breathing",
            countedTypes.includes("zoom_out") && "zoom_out",
            countedTypes.includes("historical_insight") && "history",
            countedTypes.includes("signal") && "signal",
            countedTypes.includes("ground_nudge") && "grounding",
          ].filter(Boolean),
          hasNote: !!(r.note_text && r.note_text.length > 10),
          tagCount: r.tags?.length || 0,
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

      const userPrompt = `Here is the user's skill data (${pauseRows.length} total pauses):

Skill frequency (out of ${pauseRows.length} pauses):
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
        log,
        req,
      );

      if (status === 429 || status === 402) {
        try {
          log.error("reflection_insights_rate_limited", {
            holzen_event: "reflection_insights_rate_limited",
            user_id: userId,
            status,
          });
        } catch {
          /* non-fatal */
        }
        continue;
      }
      if (!aiData) {
        try {
          log.error("reflection_insights_ai_empty", {
            holzen_event: "reflection_insights_ai_empty",
            user_id: userId,
            status,
          });
        } catch {
          /* non-fatal */
        }
        continue;
      }

      const raw = (aiData as LovableChatCompletion).choices?.[0]?.message?.content || "";
      let insights: unknown[] = [];
      try {
        const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object" && "insights" in parsed && Array.isArray((parsed as { insights: unknown }).insights)) {
          insights = (parsed as { insights: unknown[] }).insights;
        } else if (Array.isArray(parsed)) {
          insights = parsed;
        } else if (parsed && typeof parsed === "object" && "insights" in parsed) {
          const ins = (parsed as { insights: unknown }).insights;
          insights = Array.isArray(ins) ? ins : [];
        }
      } catch {
        const m = raw.match(/\{[\s\S]*\}/);
        if (!m) {
          try {
            log.error("reflection_insights_parse_failed", {
              holzen_event: "reflection_insights_parse_failed",
              user_id: userId,
            });
          } catch {
            /* non-fatal */
          }
          continue;
        }
        const parsed: unknown = JSON.parse(m[0]);
        if (parsed && typeof parsed === "object" && "insights" in parsed && Array.isArray((parsed as { insights: unknown }).insights)) {
          insights = (parsed as { insights: unknown[] }).insights;
        } else if (Array.isArray(parsed)) {
          insights = parsed;
        } else {
          insights = [];
        }
      }

      if (!insights || !Array.isArray(insights)) continue;

      await supabase.from("reflection_insights").insert({
        user_id: userId,
        insights,
        reflection_count: pauseRows.length,
        period_start: pauseRows[pauseRows.length - 1].created_at,
        period_end: pauseRows[0].created_at,
        generated_at: new Date().toISOString(),
        language: userLanguage,
      });

      generated++;
    }

    log("reflection_insights_complete", {
      holzen_event: "reflection_insights_cron",
      phase: "run_complete",
      generated,
      mode: singleUserId ? "user" : "batch",
    });
    return new Response(JSON.stringify({ generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("reflection_insights_uncaught", {
      holzen_event: "reflection_insights_cron",
      phase: "uncaught",
      ...unknownErrorForLog(e),
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
