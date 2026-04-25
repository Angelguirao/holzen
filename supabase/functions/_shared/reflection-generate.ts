/**
 * Unified reflection generation for manual pause (holzen-reflect) and
 * automatic volatility (check-volatility). JSON message + haiku only; companion
 * columns are filled by companion-orchestrate.
 */

import { containsSlop, containsCryptoLanguage } from "./quality.ts";

/** Bump when the system prompt, tone rules, or quality gate changes. */
export const REFLECTION_PROMPT_VERSION = "v5";

export interface UnifiedReflectionResult {
  message: string;
  haiku: string | null;
  grounding_title: string | null;
  grounding_body: string | null;
  grounding_citation: string | null;
  grounding_url: string | null;
}

export interface MoodHistoryEntry {
  mood: string;
  outcome?: string | null;
  created_at?: string;
}

export interface GenerateUnifiedReflectionParams {
  context: string;
  apiKey: string;
  tone?: string;
  style?: string;
  language?: string;
  currency?: string;
  moodHistory?: MoodHistoryEntry[];
  severity?: number;
  recentHaikus?: string[];
  recentMessages?: string[];
  customPrompt?: string;
  motivations?: string[];
  mantra?: string;
  groundingActivities?: string[];
  log?: (msg: string) => void;
  logAttempt?: (entry: Record<string, unknown>) => void;
}

export interface GenerateUnifiedReflectionOutcome {
  result: UnifiedReflectionResult | null;
  /** HTTP-like status for rate limit / payment errors (holzen-reflect uses 429/402). */
  lastStatus: number;
}

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

const TONE_FRAMINGS: Record<string, string[]> = {
  stoic: [
    "Frame this through Seneca's lens: what is within your control vs. what is not.",
    "Channel Marcus Aurelius' 'view from above' — zoom out to see this moment in the arc of a lifetime.",
    "Apply Epictetus' distinction between events and our judgments about events.",
    "Consider what a stoic sage would notice about the gap between stimulus and response right now.",
    "Reflect through the stoic concept of amor fati — loving one's fate, including this very moment.",
    "Use the stoic practice of premeditatio malorum — this was always a possibility, and you prepared for it.",
  ],
  zen: [
    "Use the image of water — rivers, rain, still ponds — to reflect on impermanence.",
    "Frame this as a koan-like observation about the nature of attachment to outcomes.",
    "Draw from the beginner's mind (shoshin) — what would someone seeing this for the first time notice?",
    "Use the metaphor of seasons changing — nothing about this moment is permanent.",
    "Reflect through the zen concept of mu (emptiness) — what remains when the numbers are stripped away?",
    "Frame through kintsukuroi — the beauty in broken things, the gold in the cracks.",
  ],
  poetic: [
    "Use the imagery of the ocean — tides, depths, horizons — to frame this moment.",
    "Draw from the language of astronomy — constellations, orbits, the vastness of space.",
    "Frame through the lens of music — rhythm, silence between notes, dissonance resolving.",
    "Use the imagery of geology — tectonic shifts, erosion, the patience of stone.",
    "Draw from weather — not storms (too obvious), but the quiet before, the light after, the way clouds reshape.",
    "Frame through the language of gardening — seeds, dormancy, seasons of growth and rest.",
  ],
  blunt: [
    "Name the emotion plainly. No metaphor, no spin.",
    "State what actually changed vs. what the mind is making up about it.",
    "Point out the gap between what happened and the story being told about it.",
    "Ask one hard question about what this reaction reveals.",
    "Name the cognitive bias at play — no sugar-coating.",
    "Separate the signal from the noise in one sentence.",
  ],
};

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  nl: "Dutch",
  fr: "French",
  tr: "Turkish",
};

/** Injected into system prompt: model must return JSON with message + haiku only. */
const REFLECTION_JSON_OUTPUT_INSTRUCTION =
  `You MUST respond with a JSON object only (no markdown). The object must contain exactly these keys:
- "message": The reflection (2-4 lines max)
- "haiku": A haiku (3 lines separated by newlines, 5-7-5 syllables)`;

const REFLECTION_NO_COMPANION_IN_MESSAGE = `
- No education, philosophy, narrative, or historical reference in the reflection — those come in the intervention step.`;

function buildAdaptiveContext(
  context: string,
  moodHistory: MoodHistoryEntry[] | undefined,
  severity: number,
): string {
  let adaptiveContext = "";

  if (moodHistory && moodHistory.length > 0) {
    const moods = moodHistory.map((m) => m.mood);
    const anxiousCount = moods.filter((m) => m === "anxious").length;
    const calmCount = moods.filter((m) => m === "calm").length;
    const total = moods.length;
    const anxiousRate = anxiousCount / total;
    const calmRate = calmCount / total;

    const recentMoods = moods.slice(0, 3);
    const recentAllAnxious = recentMoods.every((m) => m === "anxious");
    const recentAllCalm = recentMoods.every((m) => m === "calm");

    const outcomes = moodHistory.map((m) => m.outcome).filter(Boolean) as string[];
    const soldCount = outcomes.filter((o) => o === "sold").length;
    const soldRate = outcomes.length > 0 ? soldCount / outcomes.length : 0;

    if (recentAllAnxious) {
      adaptiveContext +=
        "\nADAPTIVE CONTEXT: The user has been anxious in their last 3 pause check-ins. Be extra gentle and grounding. Prioritize calm and spaciousness over challenge.";
    } else if (anxiousRate > 0.5) {
      adaptiveContext +=
        "\nADAPTIVE CONTEXT: The user tends toward anxiety across recent pauses. Lean toward warmth and reassurance without being patronizing.";
    } else if (recentAllCalm) {
      adaptiveContext +=
        "\nADAPTIVE CONTEXT: The user has been consistently calm recently. You can be slightly more thought-provoking or philosophical — they can handle depth.";
    } else if (calmRate > 0.6) {
      adaptiveContext +=
        "\nADAPTIVE CONTEXT: The user is generally composed. Offer copy that rewards their steadiness with deeper insight.";
    }

    if (soldRate > 0.4 && outcomes.length >= 3) {
      adaptiveContext += "\nThe user has a pattern of selling during volatility. Gently invite pause without judgment.";
    }

    const currentContext = context?.toLowerCase() || "";
    const isCurrentDown = currentContext.includes("is down");
    const isCurrentUp = currentContext.includes("is up");

    const pastHeld = moodHistory.find((m) => {
      if (m.outcome !== "held" && m.outcome !== "nothing") return false;
      if (isCurrentDown && m.mood === "anxious") return true;
      if (isCurrentUp && (m.mood === "excited" || m.mood === "fomo")) return true;
      return false;
    });

    if (pastHeld?.created_at) {
      const daysAgo = Math.floor((Date.now() - new Date(pastHeld.created_at).getTime()) / 86400000);
      adaptiveContext +=
        `\nJOURNEY CONTEXT: ${daysAgo} days ago, the user felt "${pastHeld.mood}" during a similar market moment and chose to hold. Gently acknowledge this pattern of composure — they've been here before and made a considered choice.`;
    }

    const recentSells = moodHistory.filter((m) => m.outcome === "sold").slice(0, 3);
    if (recentSells.length === 0 && moodHistory.length >= 5) {
      adaptiveContext += "\nThe user has a track record of holding through volatility. Acknowledge their consistency.";
    }
  }

  if (severity >= 15) {
    adaptiveContext +=
      "\nMARKET SEVERITY: Extreme move (15%+). This is a rare, high-stress moment. Be exceptionally calm and anchoring. Shorter is better.";
  } else if (severity >= 10) {
    adaptiveContext +=
      "\nMARKET SEVERITY: Major move (10%+). Emotions are likely running high. Prioritize grounding over insight.";
  } else if (severity >= 7) {
    adaptiveContext += "\nMARKET SEVERITY: Significant move (7%+). Balance grounding with perspective.";
  }

  return adaptiveContext;
}

function buildHaikuDedup(recentHaikus: string[] | undefined): string {
  if (!recentHaikus?.length) return "";
  const stopWords = new Set([
    "the", "a", "an", "is", "in", "on", "of", "and", "to", "with", "its", "that", "this", "for", "are", "was", "has", "had", "but", "not", "from", "they", "all", "been", "have", "will", "can", "just", "or", "as", "at", "be", "it", "so", "no", "do", "my", "by",
  ]);
  const wordCounts: Record<string, number> = {};
  for (const h of recentHaikus.slice(0, 5)) {
    const words = h.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const bannedWords = Object.entries(wordCounts).filter(([_, c]) => c >= 2).map(([w]) => w);

  let haikuDedup =
    `\n\nHAIKU DEDUPLICATION: The user has recently received these haikus. You MUST write something COMPLETELY DIFFERENT — different imagery, different words, different structure:\n${
      recentHaikus.slice(0, 5).map((h, i) => `${i + 1}. "${h}"`).join("\n")
    }`;
  if (bannedWords.length > 0) {
    haikuDedup +=
      `\n\nBANNED IMAGERY — these words/images appeared repeatedly and MUST NOT appear in your haiku: ${bannedWords.join(", ")}. Find entirely fresh imagery — seasons, objects, textures, sounds, landscapes, body sensations — anything NOT in this list.`;
  }
  return haikuDedup;
}

function buildMessageDedup(recentMessages: string[] | undefined): string {
  if (!recentMessages?.length) return "";
  const stopWords = new Set([
    "the", "a", "an", "is", "in", "on", "of", "and", "to", "with", "its", "that", "this", "for", "are", "was", "has", "had", "but", "not", "from", "they", "all", "been", "have", "will", "can", "just", "or", "as", "at", "be", "it", "so", "no", "do", "my", "by", "your", "you",
  ]);
  const openingPhrases = recentMessages.slice(0, 5).map((m) => m.split(/\s+/).slice(0, 6).join(" "));
  const wordCounts: Record<string, number> = {};
  for (const m of recentMessages.slice(0, 5)) {
    const words = m.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3 && !stopWords.has(w));
    for (const w of words) wordCounts[w] = (wordCounts[w] || 0) + 1;
  }
  const overusedWords = Object.entries(wordCounts).filter(([_, c]) => c >= 3).map(([w]) => w);

  let messageDedup =
    `\n\nMESSAGE DEDUPLICATION: The user has recently received these pause messages. You MUST write something structurally DIFFERENT — different opening, different metaphor, different sentence structure:\n${
      recentMessages.slice(0, 5).map((m, i) => `${i + 1}. "${m}"`).join("\n")
    }`;
  if (openingPhrases.length > 0) {
    messageDedup += `\n\nBANNED OPENINGS — do NOT start your message with any of these patterns:\n${
      openingPhrases.map((p) => `- "${p}..."`).join("\n")
    }`;
  }
  if (overusedWords.length > 0) {
    messageDedup += `\nOVERUSED WORDS — avoid these: ${overusedWords.join(", ")}. Use fresh vocabulary.`;
  }
  return messageDedup;
}

function applyQualityGateAndHaikuTrim(
  raw: { message?: string; haiku?: string | null },
  log: ((msg: string) => void) | undefined,
  logAttempt: ((e: Record<string, unknown>) => void) | undefined,
): UnifiedReflectionResult | null {
  if (!raw?.message) return null;
  const msg = raw.message;
  let qgFailed = false;
  let qgReason = "";

  if (containsSlop(msg)) {
    qgFailed = true;
    qgReason = "reflection_slop";
  } else if (containsCryptoLanguage(msg)) {
    qgFailed = true;
    qgReason = "reflection_crypto_language";
  } else if (msg.length < 20) {
    qgFailed = true;
    qgReason = "reflection_too_short";
  } else if (msg.length > 500) {
    qgFailed = true;
    qgReason = "reflection_too_long";
  } else if (msg.includes("!")) {
    qgFailed = true;
    qgReason = "reflection_exclamation";
  } else if (/\$[\d,]+(\.\d+)?/.test(msg) || /\d+(\.\d+)?\s*BTC\b/i.test(msg)) {
    qgFailed = true;
    qgReason = "reflection_fabricated_price";
  }

  const nonEmptyLines = msg.split("\n").filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length > 4) {
    log?.(`reflection line count: ${nonEmptyLines.length} lines (expected ≤4) — consider tightening prompt`);
    logAttempt?.({
      companion_type: "reflection",
      provider: "lovable",
      model: "quality_gate",
      status: "quality_gate_warning",
      latency_ms: 0,
      quality_gate_reason: "reflection_too_many_lines",
    });
  }

  let haiku: string | null = raw.haiku || null;
  if (haiku) {
    const lines = haiku.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length !== 3) {
      log?.(`haiku has ${lines.length} lines instead of 3, stripping`);
      haiku = null;
    } else if (lines.some((l) => l.trim().split(/\s+/).length < 2)) {
      log?.("haiku has a line with fewer than 2 words, stripping");
      haiku = null;
    }
  }

  if (qgFailed) {
    log?.(`reflection quality gate failed: ${qgReason}`);
    logAttempt?.({
      companion_type: "reflection",
      provider: "lovable",
      model: "quality_gate",
      status: "quality_gate_failed",
      latency_ms: 0,
      quality_gate_reason: qgReason,
    });
    return null;
  }

  return {
    message: msg,
    haiku,
    grounding_title: null,
    grounding_body: null,
    grounding_citation: null,
    grounding_url: null,
  };
}

function buildCoreSystemPrompt(params: {
  langInstruction: string;
  langCode: string;
  langName: string;
  baseTone: string;
  baseStyle: string;
  thematicFraming: string;
  adaptiveContext: string;
  toneKey: string;
  customPrompt?: string;
  motivations?: string[];
  mantra?: string;
  groundingActivities?: string[];
  haikuDedup: string;
}): string {
  const {
    langInstruction,
    langCode,
    langName,
    baseTone,
    baseStyle,
    thematicFraming,
    adaptiveContext,
    toneKey,
    customPrompt,
    motivations,
    mantra,
    groundingActivities,
    haikuDedup,
  } = params;

  return `${langInstruction}You generate a short reflection for someone during Bitcoin volatility — either opening a mindfulness app or receiving an alert. Your job is NOT to teach, inspire, or inform — it is to reduce urgency and validate what the user is feeling so they can think clearly.

${REFLECTION_JSON_OUTPUT_INSTRUCTION}

Tone: ${baseTone}
THEMATIC ANGLE FOR THIS SESSION: ${thematicFraming}
${adaptiveContext}

PRICE RULES (CRITICAL):
- Do NOT include specific dollar amounts, BTC prices, or exchange rates in the reflection
- Do NOT invent or estimate the current price — you do not know it
- You may reference the DIRECTION ("the price moved", "the number changed") but NEVER a specific number
- If the context mentions a percentage change, you may reference it generally ("a significant move") but do not repeat the exact percentage

The context may include a Fear & Greed Index score (0-100). Use this to subtly adjust your reflection:
- Extreme Fear (0-24): The crowd is panicking. Reflect on what happens when fear spreads.
- Fear (25-44): Unease is building. A good moment to notice what's driving decisions.
- Neutral (45-55): The market is quiet. Sometimes stillness is its own signal.
- Greed (56-75): Optimism is growing. Worth noticing if excitement is clouding judgment.
- Extreme Greed (76-100): Euphoria is everywhere. The hardest time to stay grounded.
Do NOT name the index or its score directly. Weave the sentiment naturally into the reflection.

Reflection rules:
- Style: ${baseStyle}
- ${toneKey === "blunt" ? "1 sentence preferred." : ""}
- Lead with emotional validation — acknowledge what the user is feeling before anything else.
- Reduce urgency. The goal is to slow down the impulse to act, not to provide perspective or wisdom.
- Preserve agency: never say "you should". Never tell the user what to do.
- No reassurance, excitement, trading advice, lists, or disclaimers.
- No exclamation marks, emojis, motivational language, reward language.
- BANNED PHRASES — NEVER use any of these: dive into, game-changer, paradigm shift, revolutionary, unprecedented, navigate the, in the world of, it's worth noting, at the end of the day, moving forward, leverage, synergy, ecosystem, disruptive, next-gen, cutting-edge, elevate, seamless, unleash
- Shorter is better. If you can say it in 2 lines, don't use 4.${
  customPrompt ? `\n\nUser's personal reflection guidance: "${customPrompt}"` : ""
}${
  motivations?.length
    ? `\n\nThe user's core motivations for holding: ${motivations.join(", ")}. Reference only if it fits naturally — don't lecture.`
    : ""
}${mantra ? `\n\nThe user's personal mantra: "${mantra}". Echo its spirit gently if it fits.` : ""}${
  groundingActivities?.length
    ? `\n\nThe user's personal grounding activities: ${groundingActivities.join(", ")}. Suggest one only if the moment clearly calls for it.`
    : ""
}

Haiku rules:
- Exactly 3 lines separated by newlines.
- Traditional 5-7-5 syllable structure.
- Captures the emotional essence of the moment. Match the chosen tone.
- No trading advice or price predictions.
- MUST be original and unique — never repeat common phrases like "red screens" or "breath moves".${haikuDedup}
${REFLECTION_NO_COMPANION_IN_MESSAGE}
${langCode !== "en" ? `\n\nAll user-visible fields (message and haiku) must be in ${langName}.` : ""}`;
}

/**
 * Generate reflection (message + haiku JSON). Grounding companion fields on the row come from companion-orchestrate.
 */
export async function generateUnifiedReflection(
  params: GenerateUnifiedReflectionParams,
): Promise<GenerateUnifiedReflectionOutcome> {
  const {
    context,
    apiKey,
    tone = "stoic",
    style = "standard",
    language = "en",
    moodHistory,
    severity: severityRaw,
    recentHaikus,
    recentMessages,
    customPrompt,
    motivations,
    mantra,
    groundingActivities,
    log,
    logAttempt,
  } = params;

  const severity = typeof severityRaw === "number" ? severityRaw : 0;
  const langCode = language || "en";
  const langName = LANG_NAMES[langCode] || "English";

  const langInstruction = langCode !== "en"
    ? `CRITICAL LANGUAGE REQUIREMENT: You MUST write ALL output — message and haiku — in ${langName}. Every single field must be in ${langName}. Do NOT use English for any generated text. This is non-negotiable.\n\n`
    : "";

  const baseTone = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.stoic;
  const baseStyle = STYLE_INSTRUCTIONS[style] || STYLE_INSTRUCTIONS.standard;
  const framingPool = TONE_FRAMINGS[tone] || TONE_FRAMINGS.stoic;
  const thematicFraming = framingPool[Math.floor(Math.random() * framingPool.length)];
  const adaptiveContext = buildAdaptiveContext(context, moodHistory, severity);
  const haikuDedup = buildHaikuDedup(recentHaikus);
  const messageDedup = buildMessageDedup(recentMessages);

  const systemPromptBase = buildCoreSystemPrompt({
    langInstruction,
    langCode,
    langName,
    baseTone,
    baseStyle,
    thematicFraming,
    adaptiveContext,
    toneKey: tone,
    customPrompt,
    motivations,
    mantra,
    groundingActivities,
    haikuDedup,
  });

  const fullSystemPrompt = systemPromptBase + messageDedup;

  return await generateWithJson({
    fullSystemPrompt,
    context,
    apiKey,
    log,
    logAttempt,
  });
}

async function generateWithJson(opts: {
  fullSystemPrompt: string;
  context: string;
  apiKey: string;
  log?: (msg: string) => void;
  logAttempt?: (e: Record<string, unknown>) => void;
}): Promise<GenerateUnifiedReflectionOutcome> {
  const { fullSystemPrompt, context, apiKey, log, logAttempt } = opts;
  const aiBody = {
    messages: [
      { role: "system" as const, content: fullSystemPrompt },
      { role: "user" as const, content: context },
    ],
    response_format: { type: "json_object" as const },
    temperature: 0.7,
  };

  const TIMEOUTS = [12000, 8000];
  const models = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"];
  let parsed: { message?: string; haiku?: string | null } | null = null;
  let lastStatus = 500;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const timeoutMs = TIMEOUTS[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const attemptT0 = Date.now();
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...aiBody, model }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429 || response.status === 402) {
        lastStatus = response.status;
        await response.text();
        logAttempt?.({
          companion_type: "reflection",
          provider: "lovable",
          model,
          status: "error",
          latency_ms: Date.now() - attemptT0,
          error_message: `HTTP ${response.status}`,
        });
        break;
      }
      if (!response.ok) {
        const text = await response.text();
        log?.(`AI ${model} error: HTTP ${response.status} ${text.slice(0, 200)}`);
        lastStatus = response.status;
        logAttempt?.({
          companion_type: "reflection",
          provider: "lovable",
          model,
          status: "error",
          latency_ms: Date.now() - attemptT0,
          error_message: `HTTP ${response.status}`,
        });
        if (i < models.length - 1) continue;
        break;
      }

      const data = await response.json();
      const usage = data.usage;
      const raw = data.choices?.[0]?.message?.content || "";

      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        const m = (typeof raw === "string" ? raw : "").match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
        else {
          logAttempt?.({
            companion_type: "reflection",
            provider: "lovable",
            model,
            status: "error",
            latency_ms: Date.now() - attemptT0,
            error_message: "json_parse_failed",
            input_tokens: usage?.prompt_tokens,
            output_tokens: usage?.completion_tokens,
          });
          if (i < models.length - 1) continue;
          else break;
        }
      }

      if (parsed?.message) {
        logAttempt?.({
          companion_type: "reflection",
          provider: "lovable",
          model,
          status: "success",
          latency_ms: Date.now() - attemptT0,
          input_tokens: usage?.prompt_tokens,
          output_tokens: usage?.completion_tokens,
        });
        break;
      }
      logAttempt?.({
        companion_type: "reflection",
        provider: "lovable",
        model,
        status: "error",
        latency_ms: Date.now() - attemptT0,
        error_message: "missing message field",
        input_tokens: usage?.prompt_tokens,
        output_tokens: usage?.completion_tokens,
      });
      if (i < models.length - 1) {
        parsed = null;
        continue;
      }
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof DOMException && e.name === "AbortError") {
        log?.(`AI ${model} timed out after ${timeoutMs}ms`);
        lastStatus = 504;
        logAttempt?.({
          companion_type: "reflection",
          provider: "lovable",
          model,
          status: "timeout",
          latency_ms: Date.now() - attemptT0,
        });
        if (i < models.length - 1) continue;
        break;
      }
      throw e;
    }
  }

  const gated = parsed ? applyQualityGateAndHaikuTrim(parsed, log, logAttempt) : null;
  return { result: gated, lastStatus };
}
