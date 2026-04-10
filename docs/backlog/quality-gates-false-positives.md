# Quality gates: false rejects and localization

**Shipped (partial, 2026-04).** Observability + specificity tuning; locale-aware prompts remain a separate follow-up.

## What we did

### 1. Measure / visibility

- **`logQualityGateStructuredReject(companionType, reason)`** in `supabase/functions/_shared/quality.ts` — JSON line with **`holzen_event`:** **`quality_gate_reject`**, **`companion_type`**, **`reason`** (no PII / no body).
- **Signal, history, grounding:** after a successful Lovable structuring call, if **`qualityGate`** fails, append **`generation_attempts`** row with **`status`** **`quality_gate_failed`** and **`quality_gate_reason`** (plus structured Edge log).
- **Zoom-out deep-time:** same structured log; **`logAttempt`** already existed — now uses real **`qg.reason`** instead of a fixed **`deep_time_quality`** string when available.

### 2. Tune (fewer false rejects)

- **`ground_nudge` specificity:** accept **Unicode** “Two-Word Name” via `\p{Lu}\p{L}+` / **`u`** flag; also **“et al.”** and **DOI** (`10.xxxx/...`) in body+citation as anchors.
- **`historical_insight` specificity:** accept **numeric dates** `DD/MM/YYYY`, `MM-DD-YYYY`, and **`YYYY-MM-DD`** style in addition to English month names and bare years.

### 3. Hard vs soft

- Documented in **`quality.ts`**: any **`pass: false`** is a **hard** reject on the live path (generators fall back to cache/curated). Reasons are stable codes for SQL rollups.

## Follow-up

- Pass **`language`** from orchestration into **`qualityGate`** for stricter/looser rules per locale (not done).
- Optional Vitest for **`logQualityGateStructuredReject`** (console spy) — low value.

## Related

- `supabase/functions/_shared/quality.ts`
- `supabase/functions/_shared/generators/{signal,history,grounding,zoom-out}.ts`
- `docs/ops/logging-strategy.md`
