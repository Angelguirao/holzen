/**
 * Dynamic question generator for Question Mode interventions.
 *
 * Generates exactly one decision-relevant question using Gemini.
 * The question surfaces the user's internal state — it does not seek
 * external information or teach. No static pool; fully context-aware.
 */

export interface GenerateQuestionParams {
  context: string;
  mood?: string;
  direction: "up" | "down" | "neutral";
  severity: "mild" | "moderate" | "high";
  moodHistory?: Array<{ mood: string; outcome?: string | null }>;
  apiKey: string;
  language?: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", pt: "Portuguese",
  de: "German", nl: "Dutch", fr: "French", tr: "Turkish",
};

export async function generateQuestion(params: GenerateQuestionParams): Promise<string | null> {
  const { context, mood, direction, severity, moodHistory, apiKey, language = "en" } = params;

  const langName = LANG_NAMES[language] || "English";
  const langInstruction = language !== "en"
    ? `CRITICAL: Output the question in ${langName} only. No English.\n\n`
    : "";

  // Build behavioral context hint from mood history
  let behaviorHint = "";
  if (moodHistory && moodHistory.length > 0) {
    const outcomes = moodHistory.map((m) => m.outcome).filter(Boolean);
    const soldRate = outcomes.length > 0
      ? outcomes.filter((o) => o === "sold").length / outcomes.length
      : 0;
    if (soldRate > 0.4 && outcomes.length >= 3) {
      behaviorHint = "The user has a pattern of selling during volatility. ";
    } else if (soldRate === 0 && outcomes.length >= 3) {
      behaviorHint = "The user has consistently held through past volatility. ";
    }
  }

  const systemPrompt = `${langInstruction}You generate a single question for someone who has just opened a mindfulness app during Bitcoin volatility.

${behaviorHint}Market context: ${context}. User mood: ${mood || "unknown"}. Move direction: ${direction}. Severity: ${severity}.

The question must:
- Be exactly 1 sentence
- Surface the user's internal state, not seek external information
- Help them think clearly about their decision, not inform them about the market
- Contain zero explanation, zero preamble, zero follow-up
- Vary its sentence structure — do NOT start with "Are you", "Do you", or "Have you"
- Feel personal and specific to this moment, not generic

Style reference (do NOT copy these, only match their directness):
- "If this continues, what would you actually do?"
- "What outcome are you trying to avoid right now?"
- "What would you tell a friend who asked you whether to sell right now?"
- "Is the discomfort you feel coming from the price, or from something else?"
- "What decision are you hoping the market makes for you?"

Return JSON: { "question": "..." }`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[QUESTION] AI error:", response.status);
      return null;
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const question = typeof parsed?.question === "string" ? parsed.question.trim() : null;

    if (!question || question.length < 10 || question.length > 200) return null;
    return question;
  } catch (e) {
    clearTimeout(timeout);
    console.error("[QUESTION] error:", e instanceof Error ? e.message : String(e));
    return null;
  }
}
