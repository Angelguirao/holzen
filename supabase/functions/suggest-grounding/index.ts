import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { companionFallbacksDisabled, COMPANION_FALLBACKS_DISABLED_MESSAGE } from "../_shared/fallbacks.ts";
import { sanitizePromptArray } from "../_shared/sanitize.ts";
import { createAttemptLogger } from "../_shared/observe.ts";
import { callPerplexityChat, type PerplexityUsage } from "../_shared/perplexity-client.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { AI_TEMPORARILY_UNAVAILABLE_MESSAGE } from "../_shared/ai-user-messages.ts";
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

async function searchRecentArticle(
  activity: string,
  _langCode: string,
): Promise<{ title: string; url: string; snippet: string; usage?: PerplexityUsage; searchMs: number } | null> {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) return null;

  const t0 = Date.now();
  try {
    const query = `latest interesting discovery or technique about "${activity}" for wellbeing or mindfulness`;
    const result = await callPerplexityChat(
      {
        model: "sonar",
        messages: [
          { role: "system", content: "Return a single recent, interesting finding or article about the given activity. Be concise — 1-2 sentences max." },
          { role: "user", content: query },
        ],
        search_recency_filter: "month",
      },
      PERPLEXITY_API_KEY,
      () => {},
      10_000,
    );
    const searchMs = Date.now() - t0;
    const content = result.content;
    const citations = result.citations || [];
    const firstCitation = citations[0] || null;

    if (content && firstCitation) {
      return {
        title: activity,
        url: firstCitation,
        snippet: content.slice(0, 300),
        usage: result.usage,
        searchMs,
      };
    }
    return content
      ? { title: activity, url: "", snippet: content.slice(0, 300), usage: result.usage, searchMs }
      : null;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn("[suggest-grounding] Perplexity search timed out for:", activity);
      return null;
    }
    console.error("Perplexity search failed:", e);
    return null;
  }
}

serve(
  withRequestLogging("suggest-grounding", async ({ req }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const consumeQuota = body.consumeQuota !== false;

    // Extract user for tracking
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const sbUser = createClient(sbUrl, sbAnon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await sbUser.auth.getUser();
    let logAttempt: ReturnType<typeof createAttemptLogger> | null = null;
    if (user) {
      const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
      logAttempt = createAttemptLogger(svcClient, { userId: user.id });
      try { await svcClient.from("analytics_events").insert({ user_id: user.id, event: "suggest_grounding_ai_call" }); } catch (_) { /* non-fatal */ }

      const { guardAiFeature } = await import("../_shared/ratelimit.ts");
      const guard = await guardAiFeature(svcClient, "suggest_grounding", {
        userId: user.id,
        providers: ["perplexity", "lovable"],
      });
      if (!guard.allowed) {
        console.warn(`[suggest-grounding] guard blocked: ${guard.reason ?? "unknown"}`);
        return new Response(JSON.stringify({ error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE }), {
          status: guard.status ?? 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (consumeQuota) {
        const { data: profile } = await svcClient
          .from("profiles")
          .select("lifetime_access, subscription_status, subscription_tier")
          .eq("user_id", user.id)
          .maybeSingle();
        const tier = resolveTierFromProfile(profile);
        if (tier === "free") {
          return new Response(
            JSON.stringify({
              error: "AI grounding suggestions are available on paid plans.",
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
          source: "suggest-grounding",
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
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { context, mood, severity, language } = body;
    // Sanitize user-controlled grounding activities before embedding in prompt
    const groundingActivities = sanitizePromptArray(body.groundingActivities, 10, 100);

    if (!groundingActivities || groundingActivities.length === 0) {
      return new Response(
        JSON.stringify({ error: "No grounding activities configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const langCode = language || "en";
    const LANG_NAMES: Record<string, string> = {
      en: "English", es: "Spanish", pt: "Portuguese", de: "German",
      nl: "Dutch", fr: "French", tr: "Turkish",
    };
    const langName = LANG_NAMES[langCode] || "English";
    const langInstruction = langCode !== "en"
      ? `CRITICAL: ALL output MUST be in ${langName}. Do NOT use English.\n\n`
      : "";

    const systemPrompt = `${langInstruction}You are a grounding companion for a Bitcoin holder. Your role is to suggest the most fitting personal grounding activity for this moment AND share something genuinely interesting about that activity.

The user has told us these activities help them feel grounded: ${groundingActivities.join(", ")}.

Pick the ONE activity most suited to the current emotional and market context. Your response should feel like a wise friend's gentle suggestion — personal, warm, not prescriptive.

Rules:
- Pick exactly ONE activity from the user's list
- Write a short, personal suggestion (2-3 sentences max)
- Include a gentle reason WHY this activity fits right now
- Suggest a duration that feels right (5, 10, or 15 minutes)
- Share a genuinely interesting insight, fun fact, or recent discovery about the activity (something the user probably doesn't know — a scientific finding, a technique, a cultural perspective)
- ACCURACY: The insight MUST be a well-known, verifiable fact. Do NOT invent researcher names, study dates, or statistics. If unsure, share a cultural or historical perspective instead.
- No exclamation marks, no motivational language, no trading advice
- Sound like a quiet friend, not a coach`;

    const userPrompt = `${context ? `Market context: ${context}\n` : ""}${mood ? `Current mood: ${mood}\n` : ""}${severity ? `Severity: ${severity}\n` : ""}Suggest the best grounding activity for this moment, and share something interesting about it.`;

    // Run AI suggestion and Perplexity search in parallel (we'll search for all activities, then pick the right one after AI responds)
    const aiWallClockT0 = Date.now();
    const aiController = new AbortController();
    const aiTimeout = setTimeout(() => aiController.abort(), 15000);
    const aiPromise = fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_grounding",
              description: langCode !== "en"
                ? `Suggest a grounding activity with an interesting insight. ALL fields MUST be in ${langName}.`
                : "Suggest the best grounding activity for this moment with an interesting insight.",
              parameters: {
                type: "object",
                properties: {
                  activity: {
                    type: "string",
                    description: "The activity name from the user's list (e.g. 'running', 'guitar')",
                  },
                  suggestion: {
                    type: "string",
                    description: langCode !== "en"
                      ? `A personal, warm suggestion in 2-3 sentences. MUST be in ${langName}.`
                      : "A personal, warm suggestion in 2-3 sentences explaining why this activity fits right now.",
                  },
                  duration: {
                    type: "number",
                    description: "Suggested duration in minutes (5, 10, or 15)",
                  },
                  insight: {
                    type: "string",
                    description: langCode !== "en"
                      ? `A verifiable interesting fact about this activity (1-2 sentences). MUST be in ${langName}. Do NOT invent researcher names or statistics.`
                      : "A verifiable interesting fact, well-known scientific finding, or cultural perspective about this activity (1-2 sentences). Do NOT invent researcher names or statistics.",
                  },
                },
                required: ["activity", "suggestion", "duration", "insight"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_grounding" } },
      }),
      signal: aiController.signal,
    });

    let response: Response;
    try {
      response = await aiPromise;
    } catch (e) {
      clearTimeout(aiTimeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        if (companionFallbacksDisabled()) {
          return new Response(JSON.stringify({ error: COMPANION_FALLBACKS_DISABLED_MESSAGE }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Timeout — return fallback
        const fallbackActivity = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
        return new Response(JSON.stringify({
          activity: fallbackActivity,
          suggestion: `Take a moment with ${fallbackActivity}. Sometimes the simplest thing is the most grounding.`,
          duration: 10,
          insight: null,
          article: null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw e;
    }
    clearTimeout(aiTimeout);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const geminiUsage = data.usage;
    const geminiModel = "google/gemini-3-flash-preview";

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      const chosenActivity = args.activity;

      // Now search Perplexity for a recent article about the chosen activity
      const article = await searchRecentArticle(chosenActivity, langCode);

      if (logAttempt) {
        logAttempt({
          companion_type: "suggest_grounding",
          provider: "lovable",
          model: geminiModel,
          status: "success",
          latency_ms: Date.now() - aiWallClockT0,
          input_tokens: geminiUsage?.prompt_tokens,
          output_tokens: geminiUsage?.completion_tokens,
        });
        if (article?.usage) {
          logAttempt({
            companion_type: "suggest_grounding",
            provider: "perplexity",
            model: "sonar",
            status: "success",
            latency_ms: article.searchMs,
            input_tokens: article.usage.prompt_tokens,
            output_tokens: article.usage.completion_tokens,
            api_requests: 1,
          });
        }
      }

      return new Response(JSON.stringify({
        activity: chosenActivity,
        suggestion: args.suggestion,
        duration: args.duration,
        insight: args.insight || null,
        article: article ? {
          snippet: article.snippet,
          url: article.url || null,
        } : null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (companionFallbacksDisabled()) {
      return new Response(JSON.stringify({ error: COMPANION_FALLBACKS_DISABLED_MESSAGE }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Fallback (no tool output from model)
    const fallbackActivity = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
    return new Response(JSON.stringify({
      activity: fallbackActivity,
      suggestion: `Take a moment with ${fallbackActivity}. Sometimes the simplest thing is the most grounding.`,
      duration: 10,
      insight: null,
      article: null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-grounding error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  })
);
