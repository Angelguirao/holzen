# Browser extension — behavioral MVP (Plasmo)

**Status:** Open (planned — no code in repo yet)  
**Priority:** Strategic / product wedge  
**Owner docs:** [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) · ADR [2026-05-26-browser-extension-plasmo.md](../decisions/2026-05-26-browser-extension-plasmo.md)

## Problem

Users compulsively check BTC/market pages during volatility **outside** the Holzen SPA. The web app cannot observe refresh loops on CoinMarketCap, TradingView, or exchange tabs, so interventions arrive too late or require the user to already be on Home.

## Goal

Prove: **contextual intervention reduces compulsive checking** during high-volatility sessions (behavioral north star — not install counts).

## Non-goals (v0)

- Native mobile app
- AI-generated intervention copy on every trigger
- Exchange API integrations / portfolio PnL
- Rebuilding the SPA on Next.js
- Full parity with `/pause` deep ritual inside the overlay (deep link is enough for v0)

## Phases

| Phase | Deliverable | Acceptance |
|-------|-------------|------------|
| **A — Shell** | Plasmo project (`apps/extension` or repo-root `extension/` until monorepo gate), manifest, build in CI | `pnpm`/`npm` script produces loadable Chrome extension artifact |
| **B — Signals** | Content scripts on allowlisted domains; count refreshes, tab revisits, session dwell | Telemetry logged locally + optional PostHog `extension.signal_*` events |
| **C — Interventions** | Overlay: cooldown copy + 30s breathing + link to `https://holzen.app/pause` (or deep link with auth) | User can complete or dismiss; completion fires `extension.intervention_completed` |
| **D — Context** | Volatility threshold from shared market fetch pattern (CoinGecko-style); rule `volatility > T AND checks > N` | Intervention rate correlates with vol days in staging cohort |
| **E — Engine package** | Extract rules to `packages/behavioral-engine` shared with SPA where overlap exists | Single source for thresholds; documented in implementation notes |
| **F — Measurement** | PostHog funnel: signal → intervention shown → completed → reduced checks in 30–60m window | Dashboard or notebook documented in PR |

## Allowlisted domains (initial)

Start narrow; expand only with user trust and store review in mind:

- `coinmarketcap.com`
- `www.tradingview.com`
- `www.binance.com` / `www.coinbase.com` (evaluate path patterns per site)

## Auth & data

- **Signed in:** reuse Supabase session where Plasmo storage allows; personalized thesis/reminders from existing profile/pause reads (RLS-bound).
- **Signed out:** anonymous telemetry only + generic perspective copy + CTA to sign in on web.
- **Edge calls:** `invokeEdge` wrapper + **`x-cid`** — no raw `functions.invoke` without correlation headers.
- **No service role** in extension bundle.

## UX bar

- Calm, rational, anti-hysterical tone ([intervention companion](../systems/pause/companions/intervention.md) style).
- Interventions **reduce arousal** — no engagement bait, streaks, or gamification on the overlay.
- Respect dismiss: cooldown before re-showing on same domain.

## Observability

When wiring PostHog, add rows to [event-taxonomy.md](../ops/event-taxonomy.md) **Planned** section and move to **Active** in the same PR as call sites. Draft names:

| Event | When |
|-------|------|
| `extension.market_domain_detected` | Content script matches allowlist |
| `extension.check_burst_detected` | Refreshes/revisits exceed threshold |
| `extension.intervention_shown` | Overlay displayed |
| `extension.intervention_completed` | User finished cooldown/breathing |
| `extension.intervention_dismissed` | User closed without completing |
| `extension.pause_deep_link_opened` | User opened full pause on web |

Super-property: `surface: 'extension'`.

## Testing

- Manual: load unpacked extension, reproduce check burst on staging allowlist.
- Future: Playwright + extension harness (see [e2e-browser-automation.md](./e2e-browser-automation.md) — add extension note when CI exists).

## Dependencies

- ADR accepted: [2026-05-26-browser-extension-plasmo.md](../decisions/2026-05-26-browser-extension-plasmo.md)
- Market context patterns: `src/features/market/`
- Pause deep link / auth: [route-gating-system.md](../systems/routing/route-gating-system.md)

## Open questions

- [ ] Extension-only Supabase anon key vs shared env with SPA build
- [ ] Minimum permissions copy for Chrome Web Store
- [ ] Whether check bursts persist server-side (new table) or PostHog-only for v0

Log decisions in [implementation-notes.html](../artifacts/client-implementation/implementation-notes.html) tag `browser-extension`.
