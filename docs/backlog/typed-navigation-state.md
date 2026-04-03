# Typed React Router navigation state

**Status:** backlog — tighten types incrementally.

## Goal

Replace loose casts (e.g. **`location.state as any`**) with **typed** `location.state` for routes that pass **structured** navigation payloads (notably **`/pause`** and deep links).

## Rationale

Typed state catches **drift** between senders (`navigate(..., { state })`) and receivers (page hooks) at **compile time** and documents the **contract** for [pause-session-hydration.md](pause-session-hydration.md).

## Direction

- Define **small interfaces** per route or a **discriminated union** where multiple routes use `state`.
- Use **`useLocation()`** with generics or a thin **typed wrapper** hook (e.g. `usePauseLocationState()`) where it pays off first.
- Align with [phase-2-manual-pause-pipeline.md](../reviews/phase-2-manual-pause-pipeline.md) producer/consumer notes.

## Related

- [route-gating.md](route-gating.md) — auth loading vs route UX.
- [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md) — route contracts.
