import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Determine if this is a cron call (all users) or a single-user call
    const body = await req.json().catch(() => ({}));
    const singleUserId = body.user_id as string | undefined;

    let userIds: string[] = [];

    if (singleUserId) {
      userIds = [singleUserId];
    } else {
      // Cron: generate for all users, respecting quiet hours & timezone
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, quiet_hours_start, quiet_hours_end, timezone, ai_insights_enabled");

      const eligibleProfiles = (profiles ?? []).filter((p: any) => {
        // Skip users who disabled AI insights
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
        // Wraps midnight (e.g., 22-7)
        return !(nowHour >= start || nowHour < end);
      });
      userIds = eligibleProfiles.map((p: any) => p.user_id);
    }

    let generated = 0;

    for (const userId of userIds) {
      // Get all reflections for this user
      const { data: reflections, error: refError } = await supabase
        .from("reflections")
        .select("message, context, mood, outcome, tags, created_at, breathing_completed, haiku_read, learning_read")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (refError || !reflections || reflections.length < 5) continue;

      // Build a compact summary for AI analysis
      const summary = reflections.map((r: any) => {
        const date = new Date(r.created_at);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const hour = date.getHours();
        return {
          day: dayName,
          hour,
          date: r.created_at.slice(0, 10),
          mood: r.mood || "none",
          outcome: r.outcome || "none",
          tags: r.tags?.join(",") || "",
          context: r.context?.slice(0, 80) || "",
          breathing: r.breathing_completed,
          haiku: r.haiku_read,
          learning: r.learning_read,
        };
      });

      // Mood distribution
      const moods = { anxious: 0, neutral: 0, calm: 0, none: 0 };
      const outcomes = { held: 0, bought: 0, sold: 0, none: 0 };
      for (const r of summary) {
        moods[r.mood as keyof typeof moods] = (moods[r.mood as keyof typeof moods] || 0) + 1;
        outcomes[r.outcome as keyof typeof outcomes] = (outcomes[r.outcome as keyof typeof outcomes] || 0) + 1;
      }

      const systemPrompt = `You are a behavioral pattern analyst for a Bitcoin mindfulness app called Holzen. Users reflect during BTC volatility to build emotional composure.

Analyze the user's reflection data and identify 3-5 specific, actionable patterns. Each insight should be:
- Based on actual data patterns (day-of-week, time-of-day, mood→outcome correlations, companion usage, tag frequency)
- Specific and personal, not generic advice
- 1-2 sentences max
- Categorized as: timing, mood, behavior, engagement, or growth

Examples of good insights:
- "You reflect most on Mondays and Wednesdays — and your hold rate is 20% higher on those days."
- "When you log 'anxious' mood, you sell 40% of the time. When you breathe first, that drops to 15%."
- "Your calm mood percentage has increased from 30% to 55% over the last 30 reflections."`;

      const userPrompt = `Here is the user's reflection data (${reflections.length} total reflections):

Mood distribution: ${JSON.stringify(moods)}
Outcome distribution: ${JSON.stringify(outcomes)}

Recent reflections (newest first):
${JSON.stringify(summary.slice(0, 50), null, 0)}

Generate 3-5 behavioral insights based on real patterns in this data.`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
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
                  name: "return_insights",
                  description: "Return behavioral pattern insights for the user.",
                  parameters: {
                    type: "object",
                    properties: {
                      insights: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            category: {
                              type: "string",
                              enum: ["timing", "mood", "behavior", "engagement", "growth"],
                              description: "Category of the insight",
                            },
                            title: {
                              type: "string",
                              description: "Short headline (5-10 words)",
                            },
                            body: {
                              type: "string",
                              description: "1-2 sentence insight based on actual data patterns",
                            },
                            sentiment: {
                              type: "string",
                              enum: ["positive", "neutral", "actionable"],
                              description: "Whether this is good news, neutral observation, or something to work on",
                            },
                          },
                          required: ["category", "title", "body", "sentiment"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["insights"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: {
              type: "function",
              function: { name: "return_insights" },
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          console.error(`[INSIGHTS] Rate limited or credits exhausted for user ${userId}`);
          continue;
        }
        const t = await response.text();
        console.error("[INSIGHTS] AI error:", response.status, t);
        continue;
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) continue;

      const parsed = JSON.parse(toolCall.function.arguments);
      const insights = parsed.insights;

      if (!insights || !Array.isArray(insights)) continue;

      // Insert new insights (keep old ones)
      await supabase.from("reflection_insights").insert({
        user_id: userId,
        insights,
        reflection_count: reflections.length,
        period_start: reflections[reflections.length - 1].created_at,
        period_end: reflections[0].created_at,
        generated_at: new Date().toISOString(),
      });

      generated++;
    }

    console.log(`[INSIGHTS] Generated insights for ${generated} users`);
    return new Response(JSON.stringify({ generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[INSIGHTS] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
