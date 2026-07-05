/**
 * Curated Reflect fallback copy (land / hypothesis / inquiry).
 * Shared by edge `reflection-fallback-v2` and client `buildReflectClientFallback`.
 */

export type MarketDirection = "down" | "up" | "flat";

type MoodTable = Record<string, string> & { default: string };

const INQUIRY_BY_DIRECTION: Record<MarketDirection, MoodTable> = {
  down: {
    fearful: "What are you afraid will happen if this continues?",
    anxious: "What feels most at risk for you right now — money, identity, or something else?",
    uncertain: "What part of this move feels hardest to sit with?",
    calm: "What story are you telling yourself about why this drop matters?",
    fomo: "What would you be chasing if you acted on this dip?",
    excited: "What outcome are you hoping this drop might unlock?",
    greedy: "What would winning from this moment look like to you?",
    detached: "What would change if you treated this as weather, not verdict?",
    default: "What feels most true about why this move is hitting you right now?",
  },
  up: {
    fomo: "What are you afraid of missing if you do nothing?",
    excited: "What would you regret doing if this keeps running?",
    greedy: "What story makes this rally feel like proof you were right?",
    anxious: "What could go wrong if you confuse momentum with safety?",
    fearful: "What are you protecting by staying out or selling?",
    calm: "What would staying steady cost you emotionally right now?",
    uncertain: "What decision feels urgent — and what if it is not?",
    detached: "What would you notice if you stepped back from the hype?",
    default: "What story are you telling yourself about why this rise matters?",
  },
  flat: {
    default: "What is this moment asking you to notice about yourself?",
  },
};

const HYPOTHESIS_BY_DIRECTION: Record<MarketDirection, MoodTable> = {
  down: {
    fearful: "Sometimes the drop is not only about price — it might be about safety or what you fear losing next.",
    anxious: "The body often reads a red chart as threat before the mind has words for it.",
    uncertain: "Not knowing can feel worse than a clear bad answer — that tension might be what is loudest.",
    calm: "Steadiness on the outside does not always mean the story inside is quiet.",
    fomo: "A dip can whisper that everyone else knows something you do not — that whisper is often louder than the data.",
    excited: "Hope and fear sometimes share the same fast heartbeat when the number moves.",
    greedy: "Pain can masquerade as a chance to be proven right — that urge might be worth noticing.",
    detached: "Distance helps until it becomes a way to avoid what you actually feel.",
    default: "This might be landing as more than a chart — identity, timing, or old stories can ride along.",
  },
  up: {
    fomo: "Rallies can make stillness feel like falling behind — that pressure might not be about the asset alone.",
    excited: "Euphoria often arrives dressed as clarity — the feeling might be ahead of the facts.",
    greedy: "Proof-seeking can feel soothing when the number finally agrees with you.",
    anxious: "Gains can raise the stakes of losing them — relief and dread sometimes show up together.",
    fearful: "Staying out during a rise can carry its own kind of grief or self-blame.",
    calm: "Calm in a hot market sometimes costs you the fantasy of being the one who knew.",
    uncertain: "When direction feels obvious, doubt can feel like a weakness — it might still be information.",
    detached: "Watching from the sidelines can look peaceful while something in you keeps score.",
    default: "A green screen can feel like permission to stop questioning — the story underneath might still be complex.",
  },
  flat: {
    default: "Even a small move can stir a big inner narrative — the chart might be quieter than the feeling.",
  },
};

const LAND_BY_DIRECTION: Record<MarketDirection, MoodTable> = {
  down: {
    default: "The move can feel personal even when you tell yourself it is only a number.",
    fearful: "When fear spikes, the chart can feel like a verdict before you have had a breath.",
    anxious: "You do not need to solve this moment — urgency is allowed to soften here.",
    calm: "You can be steady and still feel the weight of a drop — both can be true.",
    fomo: "A falling price can sound like a door closing — you do not have to run toward it.",
    excited: "Even excitement can ache when the number moves against you.",
    greedy: "Wanting to be right does not make the pain less real.",
    uncertain: "Not knowing what this means yet is allowed.",
    detached: "You can watch from a distance and still feel something — that is human.",
  },
  up: {
    default: "Momentum can make everything feel urgent before you have had a breath.",
    fearful: "A rising market can feel unsafe when you are not in it — that discomfort is real.",
    anxious: "Gains can raise the volume on what might go wrong next.",
    calm: "You can hold calm while the crowd speeds up — that is not failure.",
    fomo: "The fear of missing out often arrives faster than any decision needs to.",
    excited: "Energy is welcome here — you do not have to act on every spark.",
    greedy: "Wanting more does not mean you are wrong — it might mean you are human.",
    uncertain: "A rally can feel like a test you did not study for.",
    detached: "You can step back from the noise without pretending you feel nothing.",
  },
  flat: {
    default: "This moment can feel loud. You do not need to decide anything right now — just notice what is here.",
  },
};

export function marketDirectionFromContext(context: string): MarketDirection {
  const lower = context.toLowerCase();
  if (lower.includes("is down") || lower.includes("down ")) return "down";
  if (lower.includes("is up") || lower.includes("up ")) return "up";
  return "flat";
}

function lookupMoodTemplate(table: MoodTable, mood: string | undefined): string {
  const key = (mood ?? "").toLowerCase();
  return table[key] ?? table.default;
}

export function reflectInquiryFallbackTemplate(mood: string, context: string): string {
  const direction = marketDirectionFromContext(context);
  const table = INQUIRY_BY_DIRECTION[direction] ?? INQUIRY_BY_DIRECTION.flat;
  return lookupMoodTemplate(table, mood);
}

export function reflectHypothesisFallbackTemplate(mood: string, context: string): string {
  const direction = marketDirectionFromContext(context);
  const table = HYPOTHESIS_BY_DIRECTION[direction] ?? HYPOTHESIS_BY_DIRECTION.flat;
  return lookupMoodTemplate(table, mood);
}

export function reflectLandFallbackTemplate(mood: string, context: string): string {
  const direction = marketDirectionFromContext(context);
  const table = LAND_BY_DIRECTION[direction] ?? LAND_BY_DIRECTION.flat;
  return lookupMoodTemplate(table, mood);
}

/** True when copy already ends with a direct question (skip bolt-on inquiry). */
export function reflectCopyAlreadyAsksQuestion(text: string): boolean {
  return /\?/.test(text.trim());
}

/** One paragraph: land → hypothesis → inquiry (Reflect v7 spirit). */
export function composeReflectFallbackOneVoice(
  land: string,
  hypothesis: string,
  inquiry: string,
): string {
  const parts: string[] = [];
  const l = land.trim();
  const h = hypothesis.trim();
  let q = inquiry.trim();
  if (q && !q.endsWith("?")) q = `${q}?`;

  if (l) parts.push(/[.!?]$/.test(l) ? l : `${l}.`);
  if (h) parts.push(/[.!?]$/.test(h) ? h : `${h}.`);
  if (q) parts.push(q);

  return parts.join(" ");
}
