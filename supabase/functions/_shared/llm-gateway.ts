/**
 * LLM gateway — task-aware model selection with provider cascade.
 * Order: `LLM_PROVIDER_ORDER` (default `openrouter` only). Set `google,openrouter` only if you use direct Gemini billing.
 * Failover: retryable HTTP statuses on one provider try the next credential in the chain (includes 402 billing).
 */
import { fetchInitWithIncomingTrace } from "./forward-trace-headers.ts";
import type { LlmBudgetTier } from "./llm-budget.ts";

export type { LlmBudgetTier } from "./llm-budget.ts";
export { budgetTierFromSpendRatio, resolveLlmBudgetTier } from "./llm-budget.ts";

export type LlmGatewayProvider = "google" | "openrouter";

/** Active deploys use Google and/or OpenRouter only. */
const ACTIVE_LLM_PROVIDERS: readonly LlmGatewayProvider[] = ["google", "openrouter"];

const DEFAULT_LLM_PROVIDER_ORDER: readonly LlmGatewayProvider[] = ["openrouter"];

export type LlmTask =
  | "reflect"
  | "structure"
  | "cron_digest"
  | "enrich"
  | "intervention"
  | "image";

export interface LlmCredentials {
  apiKey: string;
  provider: LlmGatewayProvider;
}

/** Circuit-breaker bucket for Gemini-family providers. */
export type LlmCircuitProvider = "google" | "perplexity";

const GOOGLE_OPENAI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

/** OpenRouter model id → Google OpenAI-compat model id. */
const GOOGLE_MODEL_MAP: Record<string, string> = {
  "google/gemini-3-flash-preview": "gemini-2.0-flash",
  "google/gemini-2.5-flash": "gemini-2.5-flash",
  "google/gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "google/gemini-2.5-flash-image": "gemini-2.0-flash-preview-image-generation",
};

const TASK_MODEL_CASCADE: Record<LlmTask, Record<LlmBudgetTier, readonly string[]>> = {
  reflect: {
    normal: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"],
    economy: ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
    critical: ["google/gemini-2.5-flash-lite"],
  },
  structure: {
    normal: ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
    economy: ["google/gemini-2.5-flash-lite"],
    critical: ["google/gemini-2.5-flash-lite"],
  },
  cron_digest: {
    normal: ["google/gemini-2.5-flash-lite"],
    economy: ["google/gemini-2.5-flash-lite"],
    critical: ["google/gemini-2.5-flash-lite"],
  },
  enrich: {
    normal: ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"],
    economy: ["google/gemini-2.5-flash-lite"],
    critical: ["google/gemini-2.5-flash-lite"],
  },
  intervention: {
    normal: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"],
    economy: ["google/gemini-2.5-flash-lite"],
    critical: ["google/gemini-2.5-flash-lite"],
  },
  image: {
    normal: ["google/gemini-2.5-flash-image"],
    economy: ["google/gemini-2.5-flash-image"],
    critical: ["google/gemini-2.5-flash-image"],
  },
};

export function resolveModelsForTask(
  task: LlmTask,
  tier: LlmBudgetTier = "normal",
): string[] {
  const cascade = TASK_MODEL_CASCADE[task]?.[tier] ?? TASK_MODEL_CASCADE.structure.normal;
  return [...cascade];
}

/** Parse `LLM_PROVIDER_ORDER` (comma-separated `google` / `openrouter`). Exported for tests. */
export function parseLlmProviderOrder(
  raw: string | undefined | null,
): LlmGatewayProvider[] {
  if (!raw?.trim()) return [...DEFAULT_LLM_PROVIDER_ORDER];
  const order: LlmGatewayProvider[] = [];
  for (const part of raw.split(",")) {
    const p = part.trim().toLowerCase();
    if (p !== "google" && p !== "openrouter") continue;
    const provider = p as LlmGatewayProvider;
    if (!order.includes(provider)) order.push(provider);
  }
  return order.length > 0 ? order : [...DEFAULT_LLM_PROVIDER_ORDER];
}

function readLlmProviderOrderFromEnv(): LlmGatewayProvider[] {
  // deno-lint-ignore no-explicit-any
  const denoGlobal = (globalThis as any).Deno;
  return parseLlmProviderOrder(denoGlobal?.env?.get?.("LLM_PROVIDER_ORDER"));
}

/**
 * When the Google circuit breaker is open, skip curated fallback only if OpenRouter
 * is configured — live generation can still run on the failover provider.
 */
export function shouldUseCuratedFallbackForGoogleDegradation(
  googleDegraded: boolean,
  chain: readonly LlmCredentials[],
): boolean {
  if (!googleDegraded) return false;
  return !chain.some((c) => c.provider === "openrouter");
}

/** Ordered provider credentials — first is primary. */
export function resolveLlmCredentialChain(
  allowedProviders?: ReadonlySet<LlmGatewayProvider>,
): LlmCredentials[] {
  const allow = (provider: LlmGatewayProvider) =>
    !allowedProviders || allowedProviders.has(provider);

  const byProvider = new Map<LlmGatewayProvider, LlmCredentials>();

  const order = readLlmProviderOrderFromEnv();
  const wantsGoogle = order.includes("google");
  const wantsOpenRouter = order.includes("openrouter");

  if (wantsGoogle) {
    const googleKey =
      Deno.env.get("GOOGLE_AI_API_KEY")?.trim() ||
      Deno.env.get("GEMINI_API_KEY")?.trim();
    if (allow("google") && googleKey) {
      byProvider.set("google", { apiKey: googleKey, provider: "google" });
    }
  }

  if (wantsOpenRouter) {
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY")?.trim();
    if (allow("openrouter") && openRouterKey) {
      byProvider.set("openrouter", { apiKey: openRouterKey, provider: "openrouter" });
    }
  }

  const chain: LlmCredentials[] = [];
  for (const provider of order) {
    const creds = byProvider.get(provider);
    if (creds) chain.push(creds);
  }
  return chain;
}

export function resolveLlmCredentials(): LlmCredentials | null {
  return resolveLlmCredentialChain()[0] ?? null;
}

/** @deprecated Use `resolveLlmCredentials()` — returns API key only. */
export function resolveLlmApiKey(): string | null {
  return resolveLlmCredentials()?.apiKey ?? null;
}

export function resolveLlmModel(model: string, provider: LlmGatewayProvider): string {
  if (provider === "google") {
    return GOOGLE_MODEL_MAP[model] ?? model.replace(/^google\//, "");
  }
  return model;
}

export function llmChatCompletionsUrl(provider: LlmGatewayProvider): string {
  return provider === "openrouter" ? OPENROUTER_CHAT_URL : GOOGLE_OPENAI_CHAT_URL;
}

/** Provider label for `generation_attempts` / logs. */
export function llmLogProvider(creds: LlmCredentials): string {
  return creds.provider;
}

function openRouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const referer = Deno.env.get("OPENROUTER_HTTP_REFERER")?.trim();
  const title = Deno.env.get("OPENROUTER_APP_TITLE")?.trim() ?? "Holzen";
  if (referer) headers["HTTP-Referer"] = referer;
  if (title) headers["X-Title"] = title;
  return headers;
}

function isRetryableLlmStatus(status: number): boolean {
  return (
    status === 402 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/**
 * Drain an LLM response body and return a fresh `Response` with the same status/headers
 * so callers can still `.text()` / `.json()` after we read the stream for failover logging.
 */
export async function rewrapDrainedLlmResponse(response: Response): Promise<Response> {
  const text = await response.text().catch(() => "");
  return new Response(text, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function llmChatCompletions(
  creds: LlmCredentials,
  opts: {
    model: string;
    body: Record<string, unknown>;
    incomingRequest?: Request;
    signal?: AbortSignal;
  },
): Promise<Response> {
  const model = resolveLlmModel(opts.model, creds.provider);
  const url = llmChatCompletionsUrl(creds.provider);
  const { model: _ignored, ...rest } = opts.body;
  const headers =
    creds.provider === "openrouter"
      ? openRouterHeaders(creds.apiKey)
      : {
        Authorization: `Bearer ${creds.apiKey}`,
        "Content-Type": "application/json",
      };

  return fetch(
    url,
    fetchInitWithIncomingTrace(opts.incomingRequest, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...rest, model }),
      signal: opts.signal,
    }),
  );
}

export interface LlmChatResult {
  response: Response;
  creds: LlmCredentials;
}

/**
 * Try each configured provider until one returns a non-retryable response.
 * On 429/5xx from a provider, falls through to the next credential in the chain.
 */
export async function llmChatCompletionsWithFallback(
  opts: {
    model: string;
    body: Record<string, unknown>;
    incomingRequest?: Request;
    signal?: AbortSignal;
    /** When set, only these providers are tried (must still be in the env chain). */
    providers?: LlmGatewayProvider[];
  },
): Promise<LlmChatResult> {
  const chain = resolveLlmCredentialChain(
    opts.providers?.length
      ? new Set(opts.providers)
      : new Set(ACTIVE_LLM_PROVIDERS),
  );
  if (chain.length === 0) {
    throw new Error(
      "No LLM credentials configured (OPENROUTER_API_KEY required for default openrouter-only order)",
    );
  }

  let lastResponse: Response | null = null;
  let lastCreds = chain[0];

  for (const creds of chain) {
    const response = await llmChatCompletions(creds, opts);
    lastResponse = response;
    lastCreds = creds;
    if (!isRetryableLlmStatus(response.status)) {
      return { response, creds };
    }
    lastResponse = await rewrapDrainedLlmResponse(response);
  }

  return { response: lastResponse!, creds: lastCreds };
}
