import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  stoic: "Write in a calm, stoic tone. Brief and grounded. Like Marcus Aurelius observing the market.",
  zen: "Write in a gentle zen tone. Spacious, almost meditative. Use natural metaphors.",
  poetic: "Write in a poetic, literary tone. Evocative and beautiful. Use imagery and rhythm.",
  blunt: "Write in a direct, blunt tone. No fluff. Say it plainly in as few words as possible.",
};

const STYLE_INSTRUCTIONS: Record<string, string> = {
  standard: "Write a reflection in 1-3 sentences.",
  "one-liner": "Write EXACTLY one sentence. Concise and impactful.",
  question: "Respond with EXACTLY one thought-provoking question. No statements.",
  metaphor: "Use a single vivid metaphor to frame the moment. 1-2 sentences max.",
  koan: "Write a short zen koan or paradox related to the moment. 1-2 sentences.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { createClient } = await import("npm:@supabase/supabase-js@2.57.2");
    const sbClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await sbClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { context, tone, customPrompt, style, moodHistory, severity, motivations, mantra, currency } = await req.json();
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

    // --- Adaptive tone logic ---
    const baseTone = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.stoic;
    const baseStyle = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.standard;

    let adaptiveContext = "";

    // Analyze mood history for patterns
    if (moodHistory && Array.isArray(moodHistory) && moodHistory.length > 0) {
      const moods = moodHistory.map((m: any) => m.mood);
      const anxiousCount = moods.filter((m: string) => m === "anxious").length;
      const calmCount = moods.filter((m: string) => m === "calm").length;
      const total = moods.length;
      const anxiousRate = anxiousCount / total;
      const calmRate = calmCount / total;

      // Check recent streak (last 3)
      const recentMoods = moods.slice(0, 3);
      const recentAllAnxious = recentMoods.every((m: string) => m === "anxious");
      const recentAllCalm = recentMoods.every((m: string) => m === "calm");

      // Check outcomes
      const outcomes = moodHistory.map((m: any) => m.outcome).filter(Boolean);
      const soldCount = outcomes.filter((o: string) => o === "sold").length;
      const soldRate = outcomes.length > 0 ? soldCount / outcomes.length : 0;

      if (recentAllAnxious) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user has been anxious in their last 3 reflections. Be extra gentle and grounding. Prioritize calm and spaciousness over challenge.";
      } else if (anxiousRate > 0.5) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user tends toward anxiety in their reflections. Lean toward warmth and reassurance without being patronizing.";
      } else if (recentAllCalm) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user has been consistently calm recently. You can be slightly more thought-provoking or philosophical — they can handle depth.";
      } else if (calmRate > 0.6) {
        adaptiveContext += "\nADAPTIVE CONTEXT: The user is generally composed. Offer reflections that reward their steadiness with deeper insight.";
      }

      if (soldRate > 0.4 && outcomes.length >= 3) {
        adaptiveContext += "\nThe user has a pattern of selling during volatility. Gently invite pause without judgment.";
      }
    }

    // Adjust for market severity
    const sev = typeof severity === "number" ? severity : 0;
    if (sev >= 15) {
      adaptiveContext += "\nMARKET SEVERITY: Extreme move (15%+). This is a rare, high-stress moment. Be exceptionally calm and anchoring. Shorter is better.";
    } else if (sev >= 10) {
      adaptiveContext += "\nMARKET SEVERITY: Major move (10%+). Emotions are likely running high. Prioritize grounding over insight.";
    } else if (sev >= 7) {
      adaptiveContext += "\nMARKET SEVERITY: Significant move (7%+). Balance grounding with perspective.";
    }

    const currencyCode = currency || "USD";
    const systemPrompt = `You generate a reflection with optional companions in response to Bitcoin volatility.

You MUST respond by calling the "generate_reflection" function. Do not respond with plain text.

Tone: ${baseTone}
${adaptiveContext}

CURRENCY: The user views BTC prices in ${currencyCode}. When mentioning any price or monetary value, format it in ${currencyCode} (e.g. use the appropriate currency symbol). Never use USD unless the user's currency IS USD.

The context may include a Fear & Greed Index score (0-100). Use this to subtly adjust your reflection:
- Extreme Fear (0-24): The crowd is panicking. Reflect on what happens when fear spreads.
- Fear (25-44): Unease is building. A good moment to notice what's driving decisions.
- Neutral (45-55): The market is quiet. Sometimes stillness is its own signal.
- Greed (56-75): Optimism is growing. Worth noticing if excitement is clouding judgment.
- Extreme Greed (76-100): Euphoria is everywhere. The hardest time to stay grounded.
Do NOT name the index or its score directly. Weave the sentiment naturally into the reflection.

Reflection rules:
- Style: ${baseStyle}
- ${tone === 'blunt' ? '1 sentence preferred.' : ''}
- Encourage pause and reflection. Preserve agency: never say "you should".
- No reassurance, excitement, urgency, trading advice, lists, disclaimers.
- No exclamation marks, emojis, motivational language, reward language.
- Just one quiet prompt for reflection.${customPrompt ? `\n\nUser's personal reflection guidance: "${customPrompt}"` : ''}${motivations && motivations.length > 0 ? `\n\nThe user's core motivations for holding: ${motivations.join(', ')}. Subtly weave this context into the reflection when relevant — don't lecture about it.` : ''}${mantra ? `\n\nThe user's personal mantra: "${mantra}". You may gently echo its spirit when it fits the moment.` : ''}

Haiku rules:
- Exactly 3 lines separated by newlines.
- Traditional 5-7-5 syllable structure.
- Captures the essence of the moment. Match the chosen tone.
- No trading advice or price predictions.

Learning input rules:
- Title: a short, factual headline (5-10 words).
- Body: 1-2 sentences about a historical Bitcoin event, market pattern, or behavioral finance insight relevant to the current context. Factual, educational, no advice.
- If on-chain data is provided in the context (mempool size, fees, hashrate, block height), USE IT to make the learning insight factually grounded. Reference actual current conditions rather than generic history.`;

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
