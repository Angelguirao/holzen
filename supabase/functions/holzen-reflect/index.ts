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
    const { context } = await req.json();
    if (!context) {
      return new Response(JSON.stringify({ error: "Missing context" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You generate a reflection with optional companions in response to Bitcoin volatility.

You MUST respond by calling the "generate_reflection" function. Do not respond with plain text.

Reflection rules:
- Exactly 1-3 sentences. Calm, minimal tone.
- Encourage pause and reflection. Preserve agency: never say "you should".
- No reassurance, excitement, urgency, trading advice, lists, disclaimers.
- No exclamation marks, emojis, motivational language, reward language.
- Just one quiet prompt for reflection.

Haiku rules:
- Exactly 3 lines separated by newlines.
- Traditional 5-7-5 syllable structure.
- Captures the essence of the moment. Calm, contemplative.
- No trading advice or price predictions.

Learning input rules:
- Title: a short, factual headline (5-10 words).
- Body: 1-2 sentences about a historical Bitcoin event, market pattern, or behavioral finance insight relevant to the current context. Factual, educational, no advice.`;

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
            { role: "user", content: context },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_reflection",
                description: "Generate a reflection message with optional haiku and learning companions.",
                parameters: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "The core reflection message (1-3 sentences).",
                    },
                    haiku: {
                      type: "string",
                      description: "A haiku (3 lines, 5-7-5 syllables) about this moment. Lines separated by newlines.",
                    },
                    learning_title: {
                      type: "string",
                      description: "Short factual headline for a historical/educational insight.",
                    },
                    learning_body: {
                      type: "string",
                      description: "1-2 sentences of factual, educational context about Bitcoin history or behavioral finance.",
                    },
                  },
                  required: ["message", "haiku", "learning_title", "learning_body"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "generate_reflection" } },
        }),
      }
    );

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

    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({
        message: args.message,
        haiku: args.haiku || null,
        learning_title: args.learning_title || null,
        learning_body: args.learning_body || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to plain content if tool call didn't work
    const message = data.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ message, haiku: null, learning_title: null, learning_body: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("holzen-reflect error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
