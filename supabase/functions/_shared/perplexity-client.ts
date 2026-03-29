/**
 * Shared Perplexity Chat Completions client (edge functions).
 * Returns API usage for cost attribution alongside content.
 */

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
): Promise<PerplexityChatResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
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
    return {
      content: data.choices?.[0]?.message?.content || "",
      citations: data.citations || [],
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
