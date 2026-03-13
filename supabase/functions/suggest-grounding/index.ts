import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { groundingActivities, context, mood, severity, language } = await req.json();

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
- No exclamation marks, no motivational language, no trading advice
- Sound like a quiet friend, not a coach`;

    const userPrompt = `${context ? `Market context: ${context}\n` : ""}${mood ? `Current mood: ${mood}\n` : ""}${severity ? `Severity: ${severity}\n` : ""}Suggest the best grounding activity for this moment, and share something interesting about it.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                      ? `An interesting fact, scientific finding, or technique about this activity (1-2 sentences). MUST be in ${langName}.`
                      : "An interesting fact, scientific finding, technique, or cultural perspective about this activity that the user probably doesn't know (1-2 sentences).",
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
    });

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

    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        activity: args.activity,
        suggestion: args.suggestion,
        duration: args.duration,
        insight: args.insight || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    const fallbackActivity = groundingActivities[Math.floor(Math.random() * groundingActivities.length)];
    return new Response(JSON.stringify({
      activity: fallbackActivity,
      suggestion: `Take a moment with ${fallbackActivity}. Sometimes the simplest thing is the most grounding.`,
      duration: 10,
      insight: null,
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
});
