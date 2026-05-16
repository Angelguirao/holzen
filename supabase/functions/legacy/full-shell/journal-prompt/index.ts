import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createAttemptLogger } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { EdgeError } from "../_shared/edge-error.ts";
import { logDependencyCall } from "../_shared/deps.ts";
import { fetchInitWithIncomingTrace } from "../_shared/forward-trace-headers.ts";
import { AI_TEMPORARILY_UNAVAILABLE_MESSAGE } from "../_shared/ai-user-messages.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";

// Reference migration: this function is one of the three wrapped for the observability
// rollout (see docs/ops/edge-logging-conventions.md § Migration plan). `withRequestLogging`
// handles CORS, correlation id, structured request/response logs, Sentry capture, and the
// standardized EdgeError → JSON response envelope. Business logic stays focused on AI orchestration.

serve(
  withRequestLogging("journal-prompt", async ({ req, log, cid }) => {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new EdgeError("auth_required", "Sign in to request journal prompts.");

    const svcClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    try {
      await svcClient
        .from("analytics_events")
        .insert({ user_id: user.id, event: "journal_prompt_ai_call" });
    } catch (_) {
      /* non-fatal */
    }
    const logAttempt = createAttemptLogger(svcClient, { userId: user.id });
    const JOURNAL_MODEL = "google/gemini-2.5-flash";

    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const guard = await guardAiFeature(svcClient, "journal_prompt", {
      userId: user.id,
      providers: ["lovable"],
    });
    if (!guard.allowed) {
      log("guard blocked", { reason: guard.reason ?? "unknown", status: guard.status ?? 503 });
      // Feature/rate guard failures are expected — they carry budget/fairness semantics
      // and should not page to Sentry. `dependency_unavailable` maps that to a 503.
      throw new EdgeError(
        "dependency_unavailable",
        AI_TEMPORARILY_UNAVAILABLE_MESSAGE,
        guard.status ?? 503
      );
    }

    const { data: profile } = await svcClient
      .from("profiles")
      .select("lifetime_access, subscription_status, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier = resolveTierFromProfile(profile);
    if (tier === "free") {
      throw new EdgeError(
        "dependency_unavailable",
        "AI journal prompts are available on paid plans.",
        402,
        { code: "ai_action_upgrade_required" },
      );
    }
    const limits = tierLimits(tier);
    const quota = await consumeAllowanceOrCredits(svcClient, {
      userId: user.id,
      feature: "premium_companion",
      limit: limits.premium_companion,
      amount: 1,
      reason: "companions_overage",
      source: "journal-prompt",
    });
    if (!quota.allowed) {
      throw new EdgeError(
        "dependency_unavailable",
        "You've used this month's AI guidance allowance.",
        402,
        {
          code: "ai_action_quota_exceeded",
          tier,
          allowance_limit: quota.limit,
          allowance_used: quota.used,
          allowance_remaining: quota.remainingAllowance,
          credits_balance: quota.creditsBalance,
          credits_needed: Math.max(0, quota.creditCost - quota.creditsBalance),
        },
      );
    }

    const { language: rawLang } = await req
      .json()
      .catch(() => ({ language: "en" }));
    const langCode = rawLang || "en";
    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langName = LANG_NAMES[langCode] || "English";

    const { data: recentPauses } = await sb
      .from("v_pause_full")
      .select("reflection_text, context_snapshot, initial_mood, outcome, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentJournals } = await sb
      .from("practice_entries")
      .select("prompt, body")
      .eq("user_id", user.id)
      .eq("type", "journal")
      .order("created_at", { ascending: false })
      .limit(3);

    const contextBlock = recentPauses?.length
      ? `Recent pause sessions:\n${recentPauses.map((r: { context_snapshot?: { context_text?: string }; reflection_text?: string; initial_mood?: string; outcome?: string }) => {
          const ctx = r.context_snapshot?.context_text ?? "no context";
          return `- [${ctx}] ${r.reflection_text ?? ""} (mood: ${r.initial_mood ?? "unknown"}, outcome: ${r.outcome ?? "pending"})`;
        }).join("\n")}`
      : "No recent pause sessions available.";

    const recentPromptsBlock = recentJournals?.length
      ? `\n\nRecent journal prompts (DO NOT repeat these):\n${recentJournals.map((j: { prompt: string }) => `- ${j.prompt}`).join("\n")}`
      : "";

    const langInstruction =
      langCode !== "en"
        ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL prompts in ${langName}. Do NOT use English.\n\n`
        : "";

    const systemPrompt = `${langInstruction}You are a reflective journaling guide for Bitcoin holders who use a mindfulness app called Holzen. Your job is to generate 3 unique, thought-provoking journal prompts that help the user explore their emotional relationship with their investment decisions.

Rules:
- Each prompt should be 1 sentence, open-ended, and introspective
- Draw from the user's recent pause sessions when available — reference patterns, moods, or decisions you notice
- Vary the angle: one about emotions, one about patterns/behavior, one about future intention
- Be warm but not patronizing. Speak like a wise friend, not a therapist
- Do NOT reference specific prices, percentages, or trading terms unless they appear in the user's pause context or notes
- Do NOT fabricate patterns — if only 1-2 pauses exist, keep prompts more general

Return a JSON object with key "prompts" containing an array of 3 strings.

${contextBlock}${recentPromptsBlock}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const t0 = Date.now();
    let response: Response;
    try {
      response = await logDependencyCall(
        log,
        "lovable-ai-gateway",
        () =>
          fetch("https://ai.gateway.lovable.dev/v1/chat/completions", fetchInitWithIncomingTrace(req, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: JOURNAL_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate 3 journal prompts for me." },
              ],
              response_format: { type: "json_object" },
              temperature: 0.9,
            }),
            signal: controller.signal,
          })),
        { operation: "chat.completions" }
      );
    } catch (e) {
      clearTimeout(timeout);
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      logAttempt({
        companion_type: "journal_prompt",
        provider: "lovable",
        model: JOURNAL_MODEL,
        status: isAbort ? "timeout" : "error",
        latency_ms: Date.now() - t0,
        error_message: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      logAttempt({
        companion_type: "journal_prompt",
        provider: "lovable",
        model: JOURNAL_MODEL,
        status: "error",
        latency_ms: Date.now() - t0,
        error_message: `HTTP ${response.status}`,
      });
      if (response.status === 429) {
        throw new EdgeError("rate_limited", "Rate limited, please try again later.");
      }
      if (response.status === 402) {
        throw new EdgeError(
          "dependency_unavailable",
          "Payment required at upstream AI provider.",
          402
        );
      }
      const errText = await response.text();
      log.error("ai_gateway_http_error", { status: response.status, body: errText.slice(0, 500) });
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    logAttempt({
      companion_type: "journal_prompt",
      provider: "lovable",
      model: JOURNAL_MODEL,
      status: "success",
      latency_ms: Date.now() - t0,
      input_tokens: result?.usage?.prompt_tokens,
      output_tokens: result?.usage?.completion_tokens,
    });
    const raw = result.choices?.[0]?.message?.content ?? "{}";

    let prompts: string[];
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      prompts = parsed.prompts || parsed;
      if (!Array.isArray(prompts)) {
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        prompts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }
    } catch {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      prompts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    log("prompts_generated", { count: prompts.length, cid });
    return new Response(JSON.stringify({ prompts }), {
      headers: { "Content-Type": "application/json" },
    });
  })
);
