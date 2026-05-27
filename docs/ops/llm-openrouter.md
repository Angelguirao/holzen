# LLM routing — OpenRouter (Holzen default)

Holzen’s edge functions call **`supabase/functions/_shared/llm-gateway.ts`**. By default only **OpenRouter** is used (`LLM_PROVIDER_ORDER` unset → `openrouter`). Direct Google (`GOOGLE_AI_API_KEY`) is **not** loaded unless you add `google` to `LLM_PROVIDER_ORDER`.

## Supabase secrets (staging + prod)

**Set**

| Secret | Notes |
|--------|--------|
| `OPENROUTER_API_KEY` | From [openrouter.ai](https://openrouter.ai/keys) |
| `OPENROUTER_HTTP_REFERER` | Your app URL (recommended) |
| `OPENROUTER_APP_TITLE` | e.g. `Holzen` (optional) |

**Remove** (dashboard → Edge Functions → Secrets) if present and you are not using direct Google:

- `GOOGLE_AI_API_KEY`
- `GEMINI_API_KEY`

Redeploy edge functions after changing secrets.

## How a request works

1. Feature code picks an **`LlmTask`** (`reflect`, `structure`, `intervention`, `enrich`, `cron_digest`, `image`).
2. **`resolveModelsForTask(task, budgetTier)`** returns an ordered list of **OpenRouter model ids** (Gemini-family ids with a `google/` prefix).
3. **`llmChatCompletionsWithFallback`** POSTs to `https://openrouter.ai/api/v1/chat/completions` with that model id unchanged.
4. On retryable errors (402, 403, 408, 429, 502–504), the gateway may try the next model in the cascade (same provider when only OpenRouter is configured).
5. **`generation_attempts`** logs `provider: openrouter` and the model id attempted.

**Budget tier** (`normal` / `economy` / `critical`) comes from **`resolveLlmBudgetTier`** (global AI spend vs app-config ceilings). Higher spend → cheaper/smaller models.

## Models by task (OpenRouter ids)

Source of truth: `TASK_MODEL_CASCADE` in `llm-gateway.ts`.

| Task | Budget `normal` | Budget `economy` | Budget `critical` |
|------|-----------------|------------------|-------------------|
| **reflect** (`holzen-reflect`) | `google/gemini-3-flash-preview` → `google/gemini-2.5-flash` | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **structure** (Signal/Grounding structure pass) | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **intervention** | `google/gemini-3-flash-preview` → `google/gemini-2.5-flash` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **enrich** | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **cron_digest** | `google/gemini-2.5-flash-lite` | same | same |
| **image** | `google/gemini-2.5-flash-image` | same | same |

Reflect tries models **in order** with timeouts **12s** then **8s** per `reflection-generate.ts`.

## Not on OpenRouter

- **Perplexity** (`PERPLEXITY_API_KEY`) — web search for Signal, Grounding, History companions (separate API).
- **Curated fallbacks** — static copy when live LLM is blocked, rate-limited, or keys missing.

## Optional: direct Google again

Set secrets `GOOGLE_AI_API_KEY` and `LLM_PROVIDER_ORDER=google,openrouter`. Direct Google uses shortened Gemini ids (`gemini-2.5-flash`, …) via `GOOGLE_MODEL_MAP`.

See also: [environment-matrix.md](environment-matrix.md), [ai-cost-model.md](../systems/costs/ai-cost-model.md).
