/** Normalize Signal `keyIdeas` for storage and UI (full-view KEY IDEAS block). */

export type SignalKeyIdeasInput = {
  body: string;
  keyIdeas?: unknown;
};

export function deriveSignalKeyIdeas(body: string, max = 4): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [];
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24);
  return sentences.slice(0, max).map((s) => (s.length > 140 ? `${s.slice(0, 137).trimEnd()}…` : s));
}

export function normalizeSignalKeyIdeas(input: SignalKeyIdeasInput): string[] {
  if (Array.isArray(input.keyIdeas)) {
    const cleaned = input.keyIdeas
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length >= 8 && s.length <= 200);
    if (cleaned.length >= 2) return cleaned.slice(0, 5);
  }
  const derived = deriveSignalKeyIdeas(input.body);
  return derived.length >= 2 ? derived : derived.length > 0 ? derived : [];
}
