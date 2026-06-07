# Tablet / desktop shell width — evolution spec

**Status:** Exploration — **Phase 1 shipped** (shell width tiers + container root; no in-card layout changes yet).  
**Context:** [client-src-layout.md](../fundamentals/client-src-layout.md) § Shell width and responsive layout; [`AppLayout`](../../src/app/components/AppLayout.tsx) (`max-w-sm`); [`BottomNav`](../../src/app/components/BottomNav.tsx) (same cap).  
**Pairs with:** [behavioral-platform-strategy.md](../fundamentals/behavioral-platform-strategy.md) (mobile-first intervention), [DESIGN.md](../../DESIGN.md) + Nox wireframes (phone-first).

This doc answers: *if Holzen deliberately widens the authenticated shell on larger viewports, what should change, what should not, and in what order?*

---

## Decision first (product)

Widening the shell is **not** “make it responsive” in the dashboard sense. It is a **product bet**:

| Bet | Widen shell | Keep phone column everywhere |
|-----|-------------|------------------------------|
| **User** | Uses Holzen on iPad / desktop regularly | Mostly phone + PWA install |
| **Job** | Journey / Archive benefit from more horizontal space | Home glance + pause ritual stay focal |
| **Risk** | More room → more monitoring UI creep | Desktop feels “empty” but calm |

**Default recommendation for MVP+:** keep **`max-w-sm` shell** until there is **evidence** (analytics, interviews) that tablet/desktop sessions need denser IA. Use this spec when that threshold is met — not as a preemptive Tailwind pass.

**North-star filter** (same as [home-market-logical-surface.md](home-market-logical-surface.md)):

> Does wider layout increase **pause** or **monitoring**?

---

## Current model (baseline)

Three width **zones**, not one global breakpoint:

| Zone | Routes | Constraint today |
|------|--------|------------------|
| App shell | `/`, `/archive`, `/journey`, `/settings/*` | `w-full max-w-sm` (~384px) + `p-6`; bottom nav `max-w-sm` |
| Full-screen flows | `/pause`, `/onboarding`, `/companion/*` | Own caps — often `max-w-lg` centered on viewport |
| Marketing / auth | `/welcome`, `/auth`, legal | `max-w-sm` / `max-w-lg` on full viewport; `sm:` OK |

**Known pitfall:** Tailwind `sm:` (640px **viewport**) fires on desktop while shell column stays ~384px. Shell screens must not rely on viewport `sm:` for in-card two-column layout.

---

## Target model (if we ship widening)

Introduce **shell width tiers** driven by **container width**, not viewport alone.

### Proposed tiers

| Tier | Approx shell width | Viewport hint (implementation aid) | Shell `max-width` token |
|------|-------------------|-----------------------------------|-------------------------|
| **S — phone** | 274–336px usable | default | `max-w-sm` (384px) — **unchanged** |
| **M — tablet** | ~448px usable | `@media (min-width: 768px)` *and* optional `min-height` | `max-w-md` (448px) |
| **L — desktop shell** | ~512px usable | `@media (min-width: 1024px)` | `max-w-lg` (512px) — **hard cap** |

**Do not** exceed `max-w-lg` for daily shell without a new Figma system. Pause ritual already uses `max-w-lg`; shell wider than pause feels visually inconsistent.

### What widens vs what stays narrow

| Surface | Widen with shell? | Notes |
|---------|-------------------|-------|
| App shell column | Yes (M/L tiers) | Single token on `AppLayout` + `BottomNav` inner wrapper |
| Home Market footer | Optional **row** at tier M+ | “Within range” + “% paused” side-by-side *only when shell container ≥ ~400px* |
| Home Your pause widget | Mostly **no** | Copy blocks stay single column; more horizontal padding only |
| Archive list rows | **Maybe** | Secondary metadata beside title at M+ (truncate rules unchanged) |
| Journey tiles | **Maybe** | 2-column stat grid at L only if Figma approves |
| Settings sections | **No** | List + toggles stay full-width in column |
| `/pause` ritual | **Independent** | Already viewport-centered `max-w-lg`; do not auto-sync to shell tier |
| Modals / sheets | Viewport-based | Radix overlays unchanged |

---

## Layout patterns (technical)

### 1. Shell container query (preferred)

Wrap shell content in a named container; components opt in to wider layouts **when the shell actually widens**:

```css
/* index.css or tailwind @layer — illustrative */
.app-shell {
  container-type: inline-size;
  container-name: shell;
}
```

```tsx
/* AppLayout — illustrative */
<div className="app-shell w-full max-w-sm md:max-w-md lg:max-w-lg">
```

```tsx
/* Footer — illustrative: row only when shell is wide enough */
<div className="@container/shell flex flex-col gap-2 @[400px]:flex-row @[400px]:justify-between">
```

**Why:** fixes viewport `sm:` vs fixed shell mismatch permanently. Tier M layout activates when **container** is wide, not when the browser window is 640px+.

### 2. Shared token (required)

Single source of truth — avoid duplicating `max-w-sm md:max-w-md` across files:

| Location | Change |
|----------|--------|
| [`AppLayout.tsx`](../../src/app/components/AppLayout.tsx) | Shell wrapper class |
| [`BottomNav.tsx`](../../src/app/components/BottomNav.tsx) | Inner `max-w-*` matches shell |
| [`tailwind.config.ts`](../../tailwind.config.ts) | Optional `shell: '384px'`, `shellMd: '448px'`, `shellLg: '512px'` |
| [`client-src-layout.md`](../fundamentals/client-src-layout.md) | Tier table + `@container` norm |

### 3. Viewport breakpoints (secondary)

Use viewport `md:` / `lg:` **only** for:

- Shell max-width token on `AppLayout` (one place)
- Marketing pages (full viewport)
- `/pause` scaffold (already uses `sm:px-6` on header)

Do **not** scatter `md:flex-row` inside shell cards without `@container/shell`.

---

## Phased rollout

### Phase 0 — Documentation + guardrails (no visual change)

- [ ] This backlog doc reviewed with product/design
- [ ] `client-src-layout.md` links here when widening is approved
- [ ] CI / lint note: discourage new `sm:flex-row` in `src/screens/home|archive|journey|settings` without container query (manual review)

**Exit:** team agrees widen is deferred or Phase 1 is scheduled.

### Phase 1 — Shell token only (low risk)

- [x] `AppLayout` + `BottomNav` share `max-w-sm md:max-w-md lg:max-w-lg` via [`app-shell-layout.ts`](../../src/app/lib/app-shell-layout.ts)
- [x] `container-type: inline-size` on shell root (`.app-shell` in `index.css`)
- [ ] Visual QA: phone unchanged; tablet/desktop column slightly wider, content still single-column

**Exit:** no overflow regressions; PWA safe areas OK.

### Phase 2 — Opt-in component layouts (medium)

Pick **1–2** high-value surfaces with Figma approval:

| Candidate | Layout at M+ | Product gate | Status |
|-----------|--------------|--------------|--------|
| [`HomeMarketWidgetFooter`](../../src/screens/home/components/HomeMarketWidgetFooter.tsx) | Row: range left, community right | Must not re-introduce monitoring density | **Shipped** (`@[400px]/shell`) |
| Archive pause row | Meta column beside title | Archive owner doc | |
| Journey pulse strip | 2-up tiles | Journey backlog | |

Each PR: `@…/shell:` + screenshot at 375 / 768 / 1280 viewports.

**Exit:** chosen surfaces pass VR / manual QA; no new chart or dashboard widgets smuggled in.

### Phase 3 — IA experiments (high — optional)

Only if Phase 2 shows retained engagement without monitoring creep:

- Side nav instead of bottom nav at `lg:` + landscape (large effort; touches routing chrome, telemetry `navigation.*`)
- Split Home: market card + pause widget side-by-side at L (**likely anti-pattern** for behavioral product — default **no**)

**Exit:** explicit ADR + Figma system update.

---

## Figma / design deliverables (before Phase 1 code)

1. **Shell frame** components at 384 / 448 / 512px content width  
2. **Home** at tier M: footer row, market collapsed card, pause widget — annotated  
3. **Explicit “do not build”** list: no multi-column price charts on Home, no Holzen dashboard  
4. Token sync: Nox spacing/type at wider shell (line length for editorial text — target **~60–75 characters**; may need `max-w-prose` on long copy even inside wider shell)

---

## Acceptance criteria (Phase 1 + 2)

| Check | Pass |
|-------|------|
| Phone 375px | Pixel-identical to today (tier S) |
| Shell 448px container | Footer (if Phase 2) can sit in one row without truncation clash |
| Desktop 1440px | Column centered; max width capped at `max-w-lg`; no full-bleed dashboard |
| `/pause` | Unchanged ritual width; entering pause from widened shell feels consistent |
| a11y | Touch targets ≥ 44px; no horizontal scroll on shell routes |
| Analytics | No new PostHog events required for Phase 1; Phase 3 nav changes → [event-taxonomy.md](../ops/event-taxonomy.md) |

---

## Open questions (product)

1. **Is empty margin on desktop a bug or brand?** (Calm, Headspace-like column vs filled layout)  
2. **iPad PWA:** install icon users — do we optimize for `768×1024` first?  
3. **Journey vs Home:** which tab benefits most from width ( drives Phase 2 order )?  
4. **Feature flag:** `shell_width_tiers` for gradual rollout? (See [feature-flags.md](../ops/feature-flags.md) if yes)

---

## Related code (audit starting points)

| File | Role |
|------|------|
| [`AppLayout.tsx`](../../src/app/components/AppLayout.tsx) | Shell `max-w-sm`, padding, header grid |
| [`BottomNav.tsx`](../../src/app/components/BottomNav.tsx) | Nav bar width cap |
| [`HomeMarketWidgetFooter.tsx`](../../src/screens/home/components/HomeMarketWidgetFooter.tsx) | Column stack today; first `@container` candidate |
| [`HomePauseWidgetMarketRow.tsx`](../../src/screens/home/components/HomePauseWidgetMarketRow.tsx) | `flex-wrap` pattern — keep at all tiers |
| [`pause-step-layout.ts`](../../src/features/pause/presentation/session/pause-step-layout.ts) | Ritual typography caps — reference for max line length |

---

## Summary

- **Today’s narrow shell is correct** for a behavioral, mobile-first PWA.  
- **Widening is optional** and should be **container-driven**, capped at **`max-w-lg`**, phased, and Figma-gated.  
- **Responsive done right** for Holzen = wrap/truncate/stack at S; **opt-in** row/grid at M/L when the **shell container** actually grows — not viewport breakpoints that lie about available width.
