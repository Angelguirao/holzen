# Session wisdom quotes (legacy)

Investor aphorism shown on the **Pause Done** reinforcement card after Decide — **not shipped** in pause-first MVP.

## What moved here

- `session-wisdom-quotes.ts` — quote catalog + `getSessionQuote()`
- `format-reinforcement-quote.ts` — `"text" — author` formatter
- `pause-done-default-reinforcement-card.tsx` — Done screen quote card UI

## Still shipped (unchanged)

- **Ground Yourself** companion slot (`companion_grounding`, behavioral-finance citations) — not the same as session quotes.

## Re-enabling

1. Re-export `getSessionQuote` / `formatReinforcementQuoteFromSession` from decide flows I/O (`pause-reflect-flows-io`, `pause-reflect-flows-flow`).
2. Pass `reinforcementQuote` through `resolvePauseDecideOutcomeFlow` → `buildPauseImpactDataOnComplete` → `PauseImpactData`.
3. Restore `PauseDoneDefaultReinforcementCard` in `pause-done-default.tsx`.
4. Update architecture-alignment `mustExist` pins if CI anchors return.

Active code must not import `@/legacy/pause-wisdom-quotes/**`.
