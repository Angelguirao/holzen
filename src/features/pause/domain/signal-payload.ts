/** Client Signal companion payload + KEY IDEAS normalization. */

export type SignalPayload = {
  title: string;
  body: string;
  source: string;
  url: string;
  quote?: string;
  keyIdeas?: string[];
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

export function normalizeSignalKeyIdeas(input: { body: string; keyIdeas?: unknown }): string[] {
  if (Array.isArray(input.keyIdeas)) {
    const cleaned = input.keyIdeas
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter((s) => s.length >= 8 && s.length <= 200);
    if (cleaned.length >= 2) return cleaned.slice(0, 5);
  }
  return deriveSignalKeyIdeas(input.body);
}

export function normalizeSignalPayload(raw: unknown): SignalPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title : '';
  const body = typeof o.body === 'string' ? o.body : '';
  const source = typeof o.source === 'string' ? o.source : '';
  const url = typeof o.url === 'string' ? o.url : '';
  if (!source.trim()) return null;
  const keyIdeas = normalizeSignalKeyIdeas({ body, keyIdeas: o.keyIdeas });
  const quote = typeof o.quote === 'string' && o.quote.trim() ? o.quote : undefined;
  return { title, body, source, url, ...(quote ? { quote } : {}), ...(keyIdeas.length ? { keyIdeas } : {}) };
}
