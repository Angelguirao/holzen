import { buildReflectionContextStripC0 } from "./reflection-context-strip-c0.ts";

export type ReflectionV2Payload = {
  schemaVersion: 2;
  land: string;
  hypothesis: string;
  inquiry: string;
  contextStrip: string;
  message: string;
  haiku?: string | null;
};

const INQUIRY_BY_MOOD: Record<string, string> = {
  fearful: "What are you afraid will happen if this continues?",
  anxious: "What feels most at risk for you right now?",
  fomo: "What are you afraid of missing if you act — or if you do not?",
  excited: "What would you regret doing if this keeps running?",
  greedy: "What story makes this moment feel like proof you were right?",
  calm: "What would staying steady cost you emotionally right now?",
  uncertain: "What part of this move feels hardest to sit with?",
  detached: "What would change if you treated this as weather, not verdict?",
};

export function inquiryFallbackForMood(mood: string | undefined, context: string): string {
  const key = (mood ?? "").toLowerCase();
  if (INQUIRY_BY_MOOD[key]) return INQUIRY_BY_MOOD[key];
  const lower = context.toLowerCase();
  if (lower.includes("is down")) {
    return "What feels most true about why this drop is hitting you right now?";
  }
  if (lower.includes("is up")) {
    return "What story are you telling yourself about why this rise matters?";
  }
  return "What is this moment asking you to notice about yourself?";
}

export function mapReflectionFallbackToV2(
  fallback: { message: string; haiku?: string | null },
  opts: { context: string; severity: number; mood?: string },
): ReflectionV2Payload {
  const land = fallback.message.trim();
  const inquiry = inquiryFallbackForMood(opts.mood, opts.context);
  const contextStrip = buildReflectionContextStripC0(opts.context, opts.severity);
  const message = [land, inquiry].filter(Boolean).join("\n\n");
  return {
    schemaVersion: 2,
    land,
    hypothesis: "",
    inquiry,
    contextStrip,
    message,
    haiku: fallback.haiku ?? null,
  };
}
