# Home market widget — logical surface (product)

**Status:** Backlog (2026-06).  
**Context:** Figma-aligned Home market card ([`docs/screens/home.md`](../screens/home.md) § Market widget footer; Wireframes [251:17255](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=251-17255), [533:36421](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=533-36421)).  
**Code:** [`MarketStatus`](../../src/screens/home/components/MarketStatus.tsx), [`HomeMarketWidgetFooter`](../../src/screens/home/components/HomeMarketWidgetFooter.tsx), [`use-market-display-preferences`](../../src/features/market/presentation/use-market-display-preferences.ts).  
**Strategy:** [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) · [strategy-and-defensibility.md](../fundamentals/strategy-and-defensibility.md) · [market-client-architecture.md](../systems/market-client-architecture.md).

This doc is **product logic**, not pixel spec. It answers: *if we rebuilt the Home market block from behavioral intent, what belongs on Home and what should move elsewhere?*

---

## Job of the block

Home market is **context supply + perspective controls** for the behavioral engine — not a portfolio or trading surface.

| Layer | Owner | Home market role |
|-------|--------|------------------|
| **Trigger truth** | Postgres + `check-volatility` cron | Client **reflects** thresholds; does not authorize fires alone |
| **Intervention** | **Your pause** widget + `/pause` | Empathy copy, move/sentiment, CTA when user should act |
| **Perspective** | User prefs (hide fiat, unit-basis mode) | Reduce arousal without leaving Home |
| **Social norm** | `holzen_community_stats` | Optional “others paused / pausing” when moment is hot |

**North-star filter for any Home market element:**

> Does this increase the chance the user **pauses**, or the chance they **monitor**?

---

## What belongs on Home (logical tiers)

### Tier 1 — keep (core)

| Element | Why |
|---------|-----|
| **Within / beyond your range** (24h directional thresholds) | Connects user settings to “is this my moment?” — best single status line |
| **Hide fiat price** | Behavioral output; masks pair + price as `••••` / `••••••` |
| **Unit-basis mode** (`1 BTC = 1 BTC`) | Bitcoin-only perspective mode; hide control **disabled** (visible, not actionable) |
| **Toolbar affordances** | Icons stay visible; disable when incoherent (BTC enter while hidden; hide while unit-basis) |

### Tier 2 — keep with gates (contextual)

| Element | Gate | Why |
|---------|------|-----|
| **Community stats** | Strongest when **beyond range**, open pause, or new offer | Social proof when stress is elevated; noise when calm |
| **Fiat pair + live price** | Default on; respect hide | Familiar anchor for users who want a number — not required for thesis |

### Tier 3 — question on Home (defer or opt-in)

| Element | Concern | Alternative surface |
|---------|---------|---------------------|
| **24h % + Fear/Greed** | Extra “check the market” pull | Expand on Home **or** only in **Your pause** when triggered |
| **7-day chart** | Charts encourage monitoring | Journey, Look Back, Archive — or pause-only when beyond range |
| **Duplicate move/sentiment** | Same fact on Market + Your pause | **Your pause owns narrative** when pause is active; Market stays quiet |

---

## Recommended logical model (future reshape)

Treat Home market as a **monitoring + perspective panel**, not a **market data widget**.

```text
Collapsed (default)
├── Status: within | ▼/▲ beyond range (daily thresholds)
├── Perspective row: fiat price OR unit-basis identity OR masked dots
├── Toolbar: BTC mode | hide (disabled states per mode)
└── Footer: range (left) + community stats (right, gated)

Expanded (opt-in detail)
├── 24h % · Fear/Greed
└── 7-day chart   ← candidate to remove from Home default path

Your pause (when triggered)
├── Opening / reflection copy
├── Compact move + sentiment + Updated
└── CTA — single owner of “what changed and what to do”
```

**Calm path:** minimal numbers; anchor + practice stats carry Home.  
**Hot path:** Your pause owns urgency; Market footer confirms *why Holzen is paying attention*.

---

## Explicit non-goals (Home market)

- Trading terminal UX (order book, targets, PnL, alerts at fixed levels as primary signal)
- Duplicating full pause context on Market when **Your pause** is already showing it
- Forcing fiat price as hero for users who chose hide or unit-basis
- Client-side trigger authority (eligibility stays server + cron)

Absolute price anchors as **optional future layer** stay in [volatility-anchor-thresholds.md](volatility-anchor-thresholds.md), not a replacement for % triggers ([2026-06-03-percent-volatility-triggers.md](../decisions/2026-06-03-percent-volatility-triggers.md)).

---

## Open product bets (not decided)

| Bet | If true | Experiment |
|-----|---------|------------|
| Default hide or unit-basis after onboarding | Home should not train price-checking | Cohort default prefs; measure return visits + pause completion |
| Remove 7d chart from Home expand | Chart drives monitoring | A/B: expand shows 24h/F&G only; chart in Journey |
| Community stats only when hot | Footer noise when calm | Hide “paused today” when within range and no open pause |
| Single market story | Redundant anatomy | When Your pause shows move row, collapse Market to status + perspective only |

---

## Implementation notes (when picking slices)

- **Display prefs:** `useMarketDisplayPreferences` — hide, unit-basis, chart expand; expand blocked in unit-basis + hidden fiat.
- **Footer projection:** `resolveMarketVolatilityRangeStatus` mirrors daily server thresholds; keep in sync with `_shared/volatility-thresholds.ts`.
- **7-day cumulative (legacy):** stripped from active pause-first (Jun 2026). Archived in `src/legacy/cumulative-threshold/`; DB column `profiles.cumulative_threshold` retained for compatibility.
- **Pause duplication:** `formatHomePauseMarketBlock` + `HomePauseWidgetMarketRow` — pause card is the canonical “hot moment” copy surface.
- **Figma vs logic:** Collapsed Market has **no** 24h/F&G ([251:17255](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=251-17255)); unit-basis layout ([533:36421](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=533-36421)). Align code when changing behavior; update this doc when **product** intent diverges from Figma.

---

## Related

- [home-pause-widget-projection.md](../systems/home-pause-widget-projection.md) — Your pause modes A–E
- [home-why-thesis-evolution.md](home-why-thesis-evolution.md) — anchor / whys on Home (separate card)
- [tracked-asset-class-evolution.md](tracked-asset-class-evolution.md) — unit-basis is BTC-only until multi-asset
