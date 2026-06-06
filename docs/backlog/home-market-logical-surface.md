# Home market widget — logical surface (product)

**Status:** Active product direction (updated 2026-06). **Next slice:** remove 7-day chart from Home expand; gate community stats when calm.  
**Context:** Figma-aligned Home market card ([`docs/screens/home.md`](../screens/home.md) § Market widget footer; Wireframes [251:17255](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=251-17255), [533:36421](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=533-36421)).  
**Code:** [`MarketStatus`](../../src/screens/home/components/MarketStatus.tsx), [`HomeMarketWidgetFooter`](../../src/screens/home/components/HomeMarketWidgetFooter.tsx), [`use-market-display-preferences`](../../src/features/market/presentation/use-market-display-preferences.ts).  
**Strategy:** [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) · [strategy-and-defensibility.md](../fundamentals/strategy-and-defensibility.md) · [market-client-architecture.md](../systems/market-client-architecture.md).

This doc is **product logic**, not pixel spec. It answers: *if we rebuilt the Home market block from behavioral intent, what belongs on Home and what should move elsewhere — and why?*

---

## Why this direction

Holzen is **behavioral software**, not a price app. Users **will** check markets somewhere; the product bet is that Home can be the place that **orients** checking toward pause instead of **training** monitoring.

Three tensions drive the layout:

| Tension | Reality | Home response |
|---------|---------|---------------|
| **Checking vs pausing** | Price curiosity is real and habitual | Allow a number under user control (hide / unit-basis); do not optimize for chart literacy |
| **Holzen vs CoinGecko** | Every tracker wins on price **paths** | Home wins on **you vs your thresholds** — within/beyond range, server-backed triggers, pause pipeline |
| **Calm vs hot moments** | Most visits are calm; stress is episodic | Calm = minimal surface; hot = **Your pause** owns narrative; Market confirms *why* Holzen cares |

**North-star filter** (apply to every element, including future viz):

> Does this increase the chance the user **pauses**, or the chance they **monitor**?

A standard 7-day price line — even collapsed-by-default and lazy-loaded — still optimizes the **monitoring** job when expanded: pattern-seeking, bounce guessing, counterfactuals. That is the same cognitive loop as exchange charts. Collapsing it by default reduces **exposure**, not **intent**. Hence: **remove the chart from Home**; do not “mindful-wash” a line chart without a different visual grammar.

**What “mindful market context” means here (if we invest later):** not a prettier chart, but **posture** — where today’s move sits relative to **the user’s configured bands**, with pause as the payoff. Price history for reflection belongs on **Look Back / Archive / Journey**, not on the daily glance surface.

---

## Job of the block

Home market is **context supply + perspective controls** for the behavioral engine — not a portfolio or trading surface.

| Layer | Owner | Home market role |
|-------|--------|------------------|
| **Trigger truth** | Postgres + `check-volatility` cron | Client **reflects** thresholds; does not authorize fires alone |
| **Intervention** | **Your pause** widget + `/pause` | Empathy copy, move/sentiment, CTA when user should act |
| **Perspective** | User prefs (hide fiat, unit-basis mode) | Reduce arousal without leaving Home |
| **Social norm** | `holzen_community_stats` | “Others paused / pausing” when moment is hot — not ambient noise |

Long term, treat Home market as a **perspective-first posture panel** (range + lens + optional anchor price), **not** a market-data widget.

---

## What belongs on Home (logical tiers)

### Tier 1 — keep (core)

| Element | Why |
|---------|-----|
| **Within / beyond your range** (24h directional thresholds) | Connects user settings to “is this my moment?” — Holzen’s differentiated signal vs raw price |
| **Hide fiat price** | Behavioral output; masks pair + price as `••••` / `••••••` — respects users who don’t want a number hero |
| **Unit-basis mode** (`1 BTC = 1 BTC`) | Bitcoin-only perspective mode; hide control **disabled** (visible, not actionable) |
| **Toolbar affordances** | Icons stay visible; disable when incoherent (BTC enter while hidden; hide while unit-basis) |

### Tier 2 — keep with gates (contextual)

| Element | Gate | Why |
|---------|------|-----|
| **Community stats** | **Only when hot:** beyond range, open pause, or new offer | Social proof when stress is elevated; footer noise when calm |
| **Fiat pair + live price** | Default on; respect hide | Familiar anchor for users who want a number — intercept checking on Holzen instead of only on CoinGecko |
| **24h % + Fear/Greed** | Opt-in **expand** only (not in collapsed default) | Secondary context; Figma collapsed wireframe has no 24h row |

### Tier 3 — off Home (move or omit)

| Element | Why off Home | Where instead |
|---------|--------------|---------------|
| **7-day price chart** | Path charts train monitoring; CoinGecko already wins this job | **Remove from Home.** Optional rich history on Journey / Look Back / Archive when job is *reflection*, not *glance* |
| **Duplicate move/sentiment** | Same fact on Market + Your pause splits attention | **Your pause owns narrative** when pause is active; Market stays quiet |

---

## Target logical model

```text
Collapsed (default)
├── Status: within | ▼/▲ beyond range (daily thresholds)
├── Perspective row: fiat price OR unit-basis identity OR masked dots
├── Toolbar: BTC mode | hide | expand (disabled when incoherent)
└── Footer: range (left) + community stats (right, gated — hot only)

Expanded (opt-in detail)
└── 24h % · Fear/Greed only   ← no 7-day price chart on Home

Your pause (when triggered)
├── Opening / reflection copy
├── Compact move + sentiment + Updated
└── CTA — single owner of “what changed and what to do”
```

**Calm path:** minimal numbers; goal/why + practice stats carry identity; Market is posture + optional anchor.  
**Hot path:** Your pause owns urgency; Market compresses to status + perspective (footer confirms *why Holzen is paying attention*).

---

## Decisions (2026-06)

| Decision | Why | Implementation slice |
|----------|-----|----------------------|
| **Remove 7d chart from Home expand** | Expanded chart is monitoring UX; lazy/collapsed defaults don’t change intent; aligns with Figma collapsed spec | Drop `MarketChartLazyGate` from Home expand; keep 24h/F&G in expand; retain chart module for future non-Home surfaces |
| **Gate community stats when calm** | “% paused today” without stress is dashboard noise, not behavioral nudge | Footer hides holzen-number lines when within range and no open pause |
| **Do not build “mindful chart” v2 on Home yet** | Without threshold-band grammar, chart polish reproduces terminal behavior | Revisit only if metrics after chart removal show users lack context *and* pause conversion suffers |

---

## Phased roadmap (after chart removal)

| Phase | What | Why wait |
|-------|------|----------|
| **A (now)** | Chart off Home; stats gated; doc + telemetry baseline | Ship thesis-aligned calm Home; measure |
| **B (data-dependent)** | **Posture expand:** bands vs user thresholds, cumulative as gauge — **not** price path | Only if users need more orientation without pause lift dropping |
| **C (reflection surfaces)** | Context chart frozen to a **past pause** on Look Back / Archive | Job is hindsight (“what was happening when I decided?”), not live trading |
| **D (experiment)** | Onboarding **lens** default (Practice vs Anchor); optional expand intent (“orient / pause / looking”) | Cohort tests; needs analytics discipline |

---

## Success metrics (2–4 weeks post slice A)

| Signal | Interpretation |
|--------|----------------|
| Home → pause start (manual + nudge) | Should stay flat or rise |
| Return Home visits within 1h | Proxy for compulsive checking — should not spike after chart removal |
| `home.market_chart_expand_toggled` | Expand rate may drop (expected); expand content changes |
| Beyond-range → pause completion | Hot-path funnel health |

---

## Explicit non-goals (Home market)

- Trading terminal UX (order book, targets, PnL, alerts at fixed levels as primary signal)
- Duplicating full pause context on Market when **Your pause** is already showing it
- Forcing fiat price as hero for users who chose hide or unit-basis
- Client-side trigger authority (eligibility stays server + cron)
- **Price-path charts on the daily Home glance** (including “mindful” reskins of line charts)

Absolute price anchors as **optional future layer** stay in [volatility-anchor-thresholds.md](volatility-anchor-thresholds.md), not a replacement for % triggers ([2026-06-03-percent-volatility-triggers.md](../decisions/2026-06-03-percent-volatility-triggers.md)).

---

## Open product bets (still not decided)

| Bet | If true | Experiment |
|-----|---------|------------|
| Default hide or unit-basis after onboarding | Home should not train price-checking | Cohort default prefs; measure return visits + pause completion |
| Single market story when pause active | Redundant anatomy | When Your pause shows move row, collapse Market to status + perspective only |
| Expand intent picker | Labels checking purpose for behavioral signals | Micro-intent on expand: orient / steady (pause) / looking |

---

## Implementation notes (when picking slices)

- **Display prefs:** `useMarketDisplayPreferences` — hide, unit-basis, chart expand; expand blocked in unit-basis + hidden fiat. After slice A, expand toggles **detail row only** (no chart fetch on Home).
- **Footer projection:** `resolveMarketVolatilityRangeStatus` mirrors daily server thresholds; keep in sync with `_shared/volatility-thresholds.ts`.
- **7-day cumulative (legacy):** stripped from active pause-first (Jun 2026). Archived in `src/legacy/cumulative-threshold/`; DB column dropped; fingerprints daily-only.
- **Pause duplication:** `formatHomePauseMarketBlock` + `HomePauseWidgetMarketRow` — pause card is the canonical “hot moment” copy surface.
- **Chart code:** `MarketChart` / `MarketChartLazyGate` may remain in repo for phase C surfaces; **not** mounted from Home after slice A.
- **Figma vs logic:** Collapsed Market has **no** 24h/F&G ([251:17255](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=251-17255)); unit-basis layout ([533:36421](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=533-36421)). Align code when changing behavior; update this doc when **product** intent diverges from Figma.

---

## Related

- [home-pause-widget-projection.md](../systems/home-pause-widget-projection.md) — Your pause modes A–E
- [home-why-thesis-evolution.md](home-why-thesis-evolution.md) — anchor / whys on Home (separate card)
- [tracked-asset-class-evolution.md](tracked-asset-class-evolution.md) — unit-basis is BTC-only until multi-asset
- [home-recharts-layout-cost.md](home-recharts-layout-cost.md) — perf work for chart (historical; Home mount removed in slice A)
