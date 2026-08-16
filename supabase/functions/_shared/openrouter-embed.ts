/**
 * OpenRouter embeddings for corpus retrieve (text-embedding-3-small, 1536-d).
 */
import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";

const OPENROUTER_EMBED_URL = "https://openrouter.ai/api/v1/embeddings";

export async function embedQueryOpenRouter(
  text: string,
  incomingRequest?: Request,
): Promise<number[] | null> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
  if (!apiKey || !text.trim()) return null;

  const model = Deno.env.get("EMBED_MODEL")?.trim() || "openai/text-embedding-3-small";
  try {
    const res = await fetch(OPENROUTER_EMBED_URL, {
      ...fetchInitWithIncomingTrace(incomingRequest, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": Deno.env.get("OPENROUTER_HTTP_REFERER") ?? "https://holzen.app",
          "X-Title": Deno.env.get("OPENROUTER_APP_TITLE") ?? "Holzen",
        },
        body: JSON.stringify({ model, input: text.slice(0, 8000) }),
      }),
    });
    if (!res.ok) {
      await res.text();
      return null;
    }
    const data = await res.json();
    const vec = data?.data?.[0]?.embedding;
    return Array.isArray(vec) ? vec : null;
  } catch {
    return null;
  }
}
