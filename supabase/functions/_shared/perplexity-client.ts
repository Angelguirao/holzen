/**
 * Shared Perplexity Chat Completions client (edge functions).
 * Returns API usage for cost attribution alongside content.
 *
 * When **`incoming`** is set, W3C / Sentry trace headers are forwarded on the
 * HTTP request (see `forward-trace-headers.ts`).
 *
 * Perplexity returns source URLs in multiple places:
 * - `citations` (string[]) — often populated
 * - `search_results[].url` — frequently populated when `citations` is empty (we merge both)
 * - Inline `https://` links in the assistant message — last-resort fallback
 */

import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";

export interface PerplexityUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface PerplexityChatResult {
  content: string;
  citations: string[];
  usage?: PerplexityUsage;
}

/**
 * Build a deduped URL list from a Perplexity JSON body.
 * Exported for tests and any caller that parses raw responses.
 */
export function normalizePerplexityCitations(data: unknown, messageContent: string): string[] {
  const d = data as Record<string, unknown> | null;
  const out: string[] = [];
  const push = (u: string) => {
    const t = u.trim();
    if (t.startsWith("http://") || t.startsWith("https://")) out.push(t);
  };

  if (d && Array.isArray(d.citations)) {
    for (const c of d.citations) {
      if (typeof c === "string") push(c);
    }
  }

  if (d && Array.isArray(d.search_results)) {
    for (const r of d.search_results) {
      const u = (r as { url?: string })?.url;
      if (typeof u === "string") push(u);
    }
  }

  const seen = new Set<string>();
  const deduped = out.filter((u) => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
  if (deduped.length > 0) return deduped;

  // Models often include markdown links or bare URLs in the message even when metadata arrays are empty
  const fromText: string[] = [];
  const seenText = new Set<string>();
  const re = /https?:\/\/[^\s\])>"']+/g;
  const matches = messageContent.match(re) ?? [];
  for (let raw of matches) {
    raw = raw.replace(/[.,;:)]+$/g, "");
    if ((raw.startsWith("http://") || raw.startsWith("https://")) && !seenText.has(raw)) {
      seenText.add(raw);
      fromText.push(raw);
    }
    if (fromText.length >= 12) break;
  }
  return fromText;
}

/** Sum token usage across multiple Perplexity calls (e.g. primary + retry). */
export function mergePerplexityUsage(a: PerplexityUsage | undefined, b: PerplexityUsage | undefined): PerplexityUsage | undefined {
  if (!a && !b) return undefined;
  const prompt = (a?.prompt_tokens ?? 0) + (b?.prompt_tokens ?? 0);
  const completion = (a?.completion_tokens ?? 0) + (b?.completion_tokens ?? 0);
  return { prompt_tokens: prompt, completion_tokens: completion };
}

export async function callPerplexityChat(
  body: Record<string, unknown>,
  apiKey: string,
  log: (msg: string) => void,
  timeoutMs = 10_000,
  incoming?: Request,
): Promise<PerplexityChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(
      "https://api.perplexity.ai/chat/completions",
      fetchInitWithIncomingTrace(incoming, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      }),
    );
    clearTimeout(timeout);
    log(`perplexity responded ${res.status}`);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Perplexity error:", res.status, errText);
      if (res.status === 429) throw new Error("RATE_LIMITED");
      throw new Error(`Perplexity ${res.status}`);
    }
    const data = await res.json();
    const u = data.usage;
    const content = data.choices?.[0]?.message?.content || "";
    const citations = normalizePerplexityCitations(data, content);
    return {
      content,
      citations,
      usage: u
        ? {
          prompt_tokens: typeof u.prompt_tokens === "number" ? u.prompt_tokens : undefined,
          completion_tokens: typeof u.completion_tokens === "number" ? u.completion_tokens : undefined,
          total_tokens: typeof u.total_tokens === "number" ? u.total_tokens : undefined,
        }
        : undefined,
    };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
