# LLM routing — OpenRouter (Holzen default)

Holzen’s edge functions call **`supabase/functions/_shared/llm-gateway.ts`**. By default only **OpenRouter** is used (`LLM_PROVIDER_ORDER` unset → `openrouter`). Direct Google (`GOOGLE_AI_API_KEY`) is **not** loaded unless you add `google` to `LLM_PROVIDER_ORDER`.

## How OpenRouter works (vs Holzen)

Per [OpenRouter quickstart](https://openrouter.ai/docs/quickstart):

- You send **one HTTP POST** per completion to `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible).
- You pass a **`model` slug** on every request (e.g. `google/gemini-2.5-flash`, `~openai/gpt-latest`).
- OpenRouter routes that request to the matching upstream provider and bills you on your OpenRouter account.

OpenRouter also offers **optional** features Holzen does **not** use by default:

| OpenRouter feature | What it does | Holzen today |
|--------------------|--------------|--------------|
| **`openrouter/auto`** ([Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router)) | NotDiamond picks a model per prompt from many providers | **Not used** — unpredictable for JSON Reflect + cost model |
| **Request `models` fallbacks** ([routing](https://openrouter.ai/docs/guides/routing/model-fallbacks)) | OpenRouter tries alternate slugs if the first fails | **Partially mirrored** — we keep our own ordered list in `TASK_MODEL_CASCADE` |
| **Provider routing / plugins** | Restrict pool (e.g. `google/*`) | **Not used** — we pass explicit Gemini slugs |

**Why Holzen picks models explicitly:** Reflect needs reliable **JSON** (`land`, `hypothesis`, `inquiry`, `message`), stable **Gemini** behavior, and **predictable cost** (see `ai-cost-model.md`). A fixed cascade per task and budget tier matches how we test and operate. That is the same pattern as the quickstart’s “choose a model slug” — not the same as `openrouter/auto`.

If you want to experiment with Auto Router later, it would be a deliberate product change (new env var, logging which model was chosen, JSON QA).

## Supabase secrets (staging + prod)

**Set**

| Secret | Notes |
|--------|--------|
| `OPENROUTER_API_KEY` | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| `OPENROUTER_HTTP_REFERER` | Your app URL (recommended) |
| `OPENROUTER_APP_TITLE` | e.g. `Holzen` (optional) |

**Remove** (dashboard → Edge Functions → Secrets):

- `GOOGLE_AI_API_KEY`
- `GEMINI_API_KEY`

Redeploy edge functions after changing secrets.

## Local files (gitignored)

Remove Google keys from:

- `supabase/.env.local`
- `.env.staging.secrets` / `.env.prod.secrets`
- Do **not** put `GOOGLE_AI_API_KEY` in `supabase/.env` for local serve

Use `npm run edge:env:bootstrap` to regenerate `supabase/.env.local` (OpenRouter + Perplexity only).

**Cursor MCP:** `.cursor/mcp-secrets.env` is separate (optional `GEMINI_API_KEY` for aistudio MCP only — not used by edge).

## Request path in code

1. Feature picks an **`LlmTask`** (`reflect`, `structure`, `intervention`, …).
2. **`resolveModelsForTask(task, budgetTier)`** → ordered **OpenRouter model ids** (below).
3. **`llmChatCompletionsWithFallback`** → POST to OpenRouter with that `model` field unchanged.
4. On retryable errors (402, 403, 408, 429, 502–504), try the **next slug in our list** (same OpenRouter key).
5. Logs: `provider: openrouter`, `model: google/gemini-…`.

**Budget tier** (`normal` / `economy` / `critical`) from **`resolveLlmBudgetTier`** (global AI spend vs app-config ceilings).

## Models by task (what OpenRouter receives)

Source: `TASK_MODEL_CASCADE` in `llm-gateway.ts`. These are **OpenRouter catalog slugs** (Gemini via Google on OpenRouter’s side).

| Task | Budget `normal` | Budget `economy` | Budget `critical` |
|------|-----------------|------------------|-------------------|
| **reflect** (`holzen-reflect`) | `google/gemini-3-flash-preview` → `google/gemini-2.5-flash` | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **structure** | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **intervention** | `google/gemini-3-flash-preview` → `google/gemini-2.5-flash` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **enrich** | `google/gemini-2.5-flash` → `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` | `google/gemini-2.5-flash-lite` |
| **cron_digest** | `google/gemini-2.5-flash-lite` | same | same |
| **image** | `google/gemini-2.5-flash-image` | same | same |

Reflect timeouts: **12s** then **8s** per slug (`reflection-generate.ts`).

Check live pricing: [openrouter.ai/models](https://openrouter.ai/models) → search `google/gemini-2.5-flash`.

## Routing lanes (greenfield policy)

| Lane | Tasks | Policy |
|------|--------|--------|
| **Critical** | `reflect` | Fixed slug cascade; JSON validation + one retry; no `openrouter/auto` |
| **Medium** | `structure`, `intervention`, `enrich` | Tiered flash / flash-lite via `resolveLlmBudgetTier` |
| **Low** | `cron_digest` | Always `gemini-2.5-flash-lite` |
| **Image** | `image` | Dedicated image model slug |

We do **not** plan to enable `openrouter/auto` on Reflect without a feature flag, response model logging, and parse-rate monitoring.

## Not on OpenRouter

- **Perplexity** (`PERPLEXITY_API_KEY`) — Signal / Grounding / History search (different API).
- **Curated fallbacks** — static copy when LLM is blocked or keys missing.

## Optional: direct Google again

Set `GOOGLE_AI_API_KEY` and `LLM_PROVIDER_ORDER=google,openrouter`. Direct Google uses shortened ids (`gemini-2.5-flash`, …) via `GOOGLE_MODEL_MAP`.

See also: [environment-matrix.md](environment-matrix.md), [ai-cost-model.md](../systems/costs/ai-cost-model.md).
