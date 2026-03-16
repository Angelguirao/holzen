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

    const body = await req.json().catch(() => ({}));
    const singleUserId = body.user_id as string | undefined;
    const bodyLanguage = body.language as string | undefined;

    let userIds: string[] = [];

    if (singleUserId) {
      userIds = [singleUserId];
    } else {
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
      let userLanguage = bodyLanguage || "en";
      if (!bodyLanguage && !singleUserId) {
        const prof = (await supabase.from("profiles").select("language").eq("user_id", userId).single()).data;
        userLanguage = (prof as any)?.language || "en";
      }

      const { data: reflections, error: refError } = await supabase
        .from("reflections")
        .select("message, context, mood, mood_after, outcome, tags, created_at, breathing_completed, haiku_read, learning_read, signal_read, zoom_out_read, history_read, note")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (refError || !reflections || reflections.length < 5) continue;

      // Build skill-oriented summary
      const summary = reflections.map((r: any) => {
        const date = new Date(r.created_at);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const hour = date.getHours();
        const volMatch = r.context?.match(/[↑↓](\d+(?:\.\d+)?)%/);
        const volatility = volMatch ? parseFloat(volMatch[1]) : 0;

        // Detect skills exercised
        const skills: string[] = [];
        if (r.mood_after && r.mood) {
          const COMPOSURE: Record<string, number> = { fomo: 10, greedy: 15, anxious: 20, fearful: 25, excited: 40, uncertain: 50, detached: 75, calm: 100 };
          if ((COMPOSURE[r.mood_after] ?? 50) > (COMPOSURE[r.mood] ?? 50)) skills.push("regulation");
        }
        if (r.breathing_completed && !skills.includes("regulation")) skills.push("regulation");
        if (volatility >= 3 && (r.outcome === "held" || r.outcome === "nothing")) skills.push("tolerance");
        if (r.outcome === "held" || r.outcome === "nothing") skills.push("alignment");
        if (r.zoom_out_read || r.history_read || r.signal_read || r.learning_read) skills.push("reappraisal");
        if ((r.note && r.note.length > 10) || (r.tags && r.tags.length > 0)) skills.push("awareness");

        return {
          day: dayName,
          hour,
          date: r.created_at.slice(0, 10),
          mood: r.mood || "none",
          mood_after: r.mood_after || "none",
          outcome: r.outcome || "none",
          volatility,
          skills,
          tools: [r.breathing_completed && "breathing", r.zoom_out_read && "zoom_out", r.history_read && "history", r.signal_read && "signal", r.learning_read && "learning"].filter(Boolean),
          hasNote: !!(r.note && r.note.length > 10),
          tagCount: r.tags?.length || 0,
        };
      });

      // Skill frequency stats
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
4. COGNITIVE REAPPRAISAL — engaging perspective-shifting tools (zoom out, history, signals, learning) especially during volatile moments
5. SELF-AWARENESS — depth of reflection through notes, tags, and pattern recognition

Analyze the user's data through this skill lens. Generate 3-5 insights about their SKILL DEVELOPMENT — not mood patterns or generic advice. Each insight should:
- Reference a specific skill and how it's developing
- Be based on actual data patterns (which skills are strong/weak, when they're exercised, correlations between skills)
- Be 1-2 sentences max
- Frame reactivity as OPPORTUNITY, not failure

Examples of good skill-based insights:
- "Your regulation skill is strongest on weekdays — you shifted from anxious to calm 80% of the time vs 40% on weekends."
- "You've exercised distress tolerance 12 times during >5% volatility. Your hold rate in those moments is 92%."
- "Cognitive reappraisal is your least-used skill (used in 15% of pauses), but when you do use it, your regulation success rate doubles."
- "Your self-awareness depth is growing — you've added notes in 60% of recent pauses, up from 20% a month ago."${langInstruction}`;

      const userPrompt = `Here is the user's skill data (${reflections.length} total pauses):

Skill frequency (out of ${reflections.length} pauses):
${JSON.stringify(skillCounts)}

Recent pauses with skill tags (newest first):
${JSON.stringify(summary.slice(0, 50), null, 0)}

Generate 3-5 skill development insights based on real patterns in this data.`;

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
                  description: "Return skill development insights for the user.",
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
                              enum: ["regulation", "tolerance", "alignment", "reappraisal", "awareness"],
                              description: "Which composure skill this insight relates to",
                            },
                            title: {
                              type: "string",
                              description: "Short headline (5-10 words)",
                            },
                            body: {
                              type: "string",
                              description: "1-2 sentence insight about skill development based on actual data patterns",
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
