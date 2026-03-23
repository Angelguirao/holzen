/**
 * Session Intent — determines a coherent theme for the entire pause session.
 *
 * Called ONCE before generating companions. The theme is then passed to each
 * generator so they align their content to the same emotional angle.
 *
 * This solves the "contradictory companions" problem where Signal talks about
 * patience while Grounding talks about FOMO and History shows a doom story.
 */

export interface SessionIntent {
  /** Primary theme key */
  theme: string;
  /** Human-readable theme description for prompts */
  themeDescription: string;
  /** Emotional tone to match */
  emotionalTone: "calming" | "cautioning" | "affirming" | "grounding";
  /** Suggested bias category for grounding */
  groundingBias: string;
  /** Suggested history mood for era selection */
  historyMood: "recovery" | "caution" | "neutral";
  /** Suggested deep-time seed category for zoom-out */
  zoomOutAngle: string;
  /** Suggested signal search angle */
  signalAngle: string;
}

interface IntentInput {
  /** Market context string (e.g. "BTC is down 5.2% in the last 24 hours") */
  context?: string;
  /** User's current mood (from mood check) */
  mood?: string;
  /** Market severity (percentage change) */
  severity?: number;
  /** User's mood history (recent moods and outcomes) */
  moodHistory?: Array<{ mood: string; outcome?: string | null }>;
}

/**
 * Theme definitions — each maps to aligned content across all companions.
 */
const THEMES: Record<string, Omit<SessionIntent, "theme">> = {
  "patience-during-fear": {
    themeDescription: "The user is fearful during a market drop. All companions should emphasize patience, historical recovery, and the wisdom of not reacting to fear.",
    emotionalTone: "calming",
    groundingBias: "loss aversion and panic selling during market drops",
    historyMood: "recovery",
    zoomOutAngle: "The patience of long timescales — things that took centuries to build",
    signalAngle: "Bitcoin philosophy about patience, conviction during difficulty, and the cost of panic",
  },
  "steadiness-during-anxiety": {
    themeDescription: "The user is anxious but not panicking. Companions should gently acknowledge the discomfort and ground the user in their own track record.",
    emotionalTone: "grounding",
    groundingBias: "emotional regulation and prefrontal cortex function during financial stress",
    historyMood: "recovery",
    zoomOutAngle: "How slowly the biggest changes happen — glaciers, tectonic plates, monetary evolution",
    signalAngle: "Bitcoin thinkers on the relationship between discomfort and growth, or sovereignty as a practice",
  },
  "humility-during-euphoria": {
    themeDescription: "The market is up and the user may be feeling excited or greedy. Companions should gently invite caution without being a buzzkill.",
    emotionalTone: "cautioning",
    groundingBias: "FOMO and herding behavior during market rallies",
    historyMood: "caution",
    zoomOutAngle: "How quickly empires and bubbles have risen and fallen throughout history",
    signalAngle: "Bitcoin philosophy about humility, the danger of euphoria, and time preference over quick gains",
  },
  "grounding-during-fomo": {
    themeDescription: "The user is experiencing FOMO. Companions should anchor them in rational thinking and their original reasons for holding.",
    emotionalTone: "grounding",
    groundingBias: "overconfidence bias and illusion of control in trading decisions",
    historyMood: "caution",
    zoomOutAngle: "The value of stillness and not chasing — things that endure by not moving",
    signalAngle: "Bitcoin philosophy about the discipline of doing nothing, or the strength in not reacting",
  },
  "affirmation-of-composure": {
    themeDescription: "The user is calm and composed despite market movement. Companions should reward this composure with deeper insight.",
    emotionalTone: "affirming",
    groundingBias: "emotional regulation and prefrontal cortex function during financial stress",
    historyMood: "neutral",
    zoomOutAngle: "The deepest truths about persistence, compounding, and long-term thinking",
    signalAngle: "The most profound Bitcoin essays about what it means to truly understand sound money",
  },
  "reflection-on-selling": {
    themeDescription: "The user has a pattern of selling during volatility. Companions should gently explore this pattern without judgment.",
    emotionalTone: "grounding",
    groundingBias: "disposition effect — selling winners too early and holding losers too long",
    historyMood: "recovery",
    zoomOutAngle: "How the greatest returns in history came from patience through the hardest moments",
    signalAngle: "Bitcoin philosophy about the relationship between conviction and discomfort",
  },
  "neutral-exploration": {
    themeDescription: "No strong emotional signal. Companions should offer interesting, thought-provoking content.",
    emotionalTone: "grounding",
    groundingBias: "anchoring bias and mental accounting in investment decisions",
    historyMood: "neutral",
    zoomOutAngle: "A surprising deep-time perspective that reframes the ordinary",
    signalAngle: "A timeless Bitcoin essay about sovereignty, sound money, or proof of work as philosophy",
  },
};

/**
 * Determine the session intent based on market conditions and user state.
 */
export function determineSessionIntent(input: IntentInput): SessionIntent {
  const { context, mood, severity, moodHistory } = input;

  // Parse market direction
  const isDown = context?.toLowerCase().includes("is down");
  const isUp = context?.toLowerCase().includes("is up");
  const sev = typeof severity === "number" ? Math.abs(severity) : 0;

  // Check user's selling pattern
  const outcomes = (moodHistory ?? []).map(m => m.outcome).filter(Boolean);
  const soldRate = outcomes.length >= 3 ? outcomes.filter(o => o === "sold").length / outcomes.length : 0;
  const hasSellPattern = soldRate > 0.3;

  // Determine theme
  let themeKey: string;

  if (hasSellPattern && isDown) {
    themeKey = "reflection-on-selling";
  } else if (mood === "fearful" || (mood === "anxious" && sev >= 7)) {
    themeKey = "patience-during-fear";
  } else if (mood === "anxious") {
    themeKey = "steadiness-during-anxiety";
  } else if (mood === "fomo" || mood === "greedy") {
    themeKey = "grounding-during-fomo";
  } else if (mood === "excited" && isUp) {
    themeKey = "humility-during-euphoria";
  } else if (mood === "calm" || mood === "detached") {
    themeKey = "affirmation-of-composure";
  } else if (isDown && sev >= 5) {
    themeKey = "patience-during-fear";
  } else if (isUp && sev >= 5) {
    themeKey = "humility-during-euphoria";
  } else {
    themeKey = "neutral-exploration";
  }

  const theme = THEMES[themeKey];
  return { theme: themeKey, ...theme };
}
