# E2E check: Pause session → Signal companion (logging)

Use this when you want to **trace one full path** from landing on **`/pause`** to **generating the Signal** card, using the same conventions as [logging-strategy.md](logging-strategy.md).

## Strategic goals (what “good” looks like)

| # | Goal | How you verify |
|---|------|----------------|
| 1 | **Client opted into debug** | DevTools Console filter **`holzen:companion`** shows lines when you expand Signal (or other slots). |
| 2 | **Request is attributed** | Edge line **`orchestrate_invoke`** includes **`invoke_source`** (`browser_lazy_fetch` for tap-to-open Signal; `browser_pause_intervention` for first intervention load). |
| 3 | **Slot outcome is explicit** | Edge line **`holzen_event":"companion_slot_resolved"`** with **`orchestrator_slot":"signal"`**, **`source`** (`cache` / `live` / `curated` / `empty`), **`filled`**, optional **`cache_relaxation`**. |
| 4 | **Cache tier visible (if cache path)** | If Signal came from **`companion_cache`**, you may also see **`cache_serve`** with **`cache_relaxation`**; should be consistent with **`companion_slot_resolved.cache_relaxation`**. |
| 5 | **Live path failures visible** | If live generation fails quality gate: **`quality_gate_reject`** with **`companion_type":"signal"`**; check **`generation_attempts`** for the same **pause instance**. |
| 6 | **Client and Edge line up** | **`lazy fetch slot filled`** (client) **`source`** matches Edge **`companion_slot_resolved`** **`source`** for the same request (same wall-clock window; client logs **`pause_instance_prefix`**, Edge slot line uses **`pause_prefix`** — both are the first 8 chars of the same **`pause_instance_id`**). |

## Preconditions

1. **Browser:** enable debug — any of: local **`npm run dev`**, **`localStorage.setItem('holzen:debug','1')`** + reload, **`?holzenDebug=1`**, or **`VITE_HOLZEN_DEBUG=1`** for hosted dev build.
2. **Edge:** filter **JSON** lines with **`"fn":"companion-orchestrate"`** (or your **`x-cid`**). **`orchestrate_invoke`**, **`orchestrate_skip_cached`**, **`companion_slot_resolved`**, and errors all come from the request **`log`** (**`withRequestLogging`** / **`createLogger`** — stdout + optional BetterStack drain), not ad-hoc `console.log`.

## Happy-path steps (manual)

1. From **Home**, complete **Need a moment** (or equivalent) so you land on **`/pause`** with **`pauseInstanceId`** in **router location state** (same shape as **`navigate('/pause', { state: { pauseInstanceId, … } })`** — see **`parsePauseSessionLocationState`**).
2. Wait for intervention / shell to load (first **`companion-orchestrate`** may be intervention-only).
3. Expand **Read the signal →** (Signal companion card).
4. **Client:** Confirm lines similar to:
   - **`[holzen:companion] lazy fetch orchestrate invoke`** — `slot: signal`, `holzenInvokeSource: browser_lazy_fetch`, `pause_instance_prefix`.
   - **`[holzen:companion] lazy fetch slot filled`** — `source`, `latencyMs`, optional `cacheRelaxation`.
5. **Supabase → Edge Functions → Logs** (same time window):
   - **`orchestrate_invoke`** — `invoke_source` / `pause_instance_prefix`.
   - **`companion_slot_resolved`** — `orchestrator_slot: signal`, `filled: true`, `source` as expected.

## Variants to exercise

| Variant | Trigger | Extra logs |
|---------|---------|------------|
| **Intervention bundled Signal** | Selector returns Signal alongside intervention | Client: **`hydrated signal from intervention response`**; Edge: same **`companion_slot_resolved`** if server filled the slot in that request. |
| **Regenerate** | Tap Regenerate on Signal | Client: **`regenerate orchestrate invoke`** / **`regenerate slot filled`**; Edge: **`companion_slot_resolved`** from **`regenerate-only`** path. |
| **Skip cached (all slots)** | Reflection already has companions in DB | **`orchestrate_skip_cached`** instead of generators; may **not** emit **`companion_slot_resolved`** for skipped batch — use skip event + DB rows. |

## Related code

- Client: [`src/hooks/use-companion-data.ts`](../../src/hooks/use-companion-data.ts), [`src/lib/holzen-console.ts`](../../src/lib/holzen-console.ts)
- Edge: [`supabase/functions/_shared/companion-orchestrate-slot-telemetry.ts`](../../supabase/functions/_shared/companion-orchestrate-slot-telemetry.ts), [`supabase/functions/_shared/companion-orchestrate-tasks.ts`](../../supabase/functions/_shared/companion-orchestrate-tasks.ts), [`supabase/functions/_shared/regenerate-only.ts`](../../supabase/functions/_shared/regenerate-only.ts)
- Pipeline narrative: [`docs/systems/pause/ai-powered-pause-system.md`](../systems/pause/ai-powered-pause-system.md)
