# Home “Your whys” — thesis & depth (backlog)

**Status:** Backlog (2026-06).  
**Context:** Pause-first Home anchor card ([Wireframes 546:8945](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=546-8945)) shows **mantra + motivations only**. Hold goal / commitment UI moved to [`src/legacy/hold-goal/`](../../src/legacy/hold-goal/README.md) (investment-strategy semantics).

**Shipped today:** `profiles.mantra`, `profiles.motivations[]`, `HomeGoalWhyCard`, Settings → You editors.

---

## Product direction (future)

Evolve “whys” from static chips + a one-line mantra toward a **durable personal thesis** — still about *meaning and regulation*, not portfolio targets or hold-duration strategy.

| Idea | Sketch | Notes |
|------|--------|--------|
| **Rational thesis** | 2–4 sentence user-authored “why I pause / why this matters” block on Home | Replaces or sits above mantra; editable in Settings; optional AI draft from motivations |
| **Structured whys** | Ranked motivations + optional free-text “what this means to me” per chip | Keeps chip UX; adds depth without investment jargon |
| **Thesis versioning** | Append-only history (“how my why evolved”) | Journey/Archive surface; privacy-sensitive |
| **Pause-linked echoes** | After Reflect, suggest one sentence that connects ritual to thesis | Opt-in; uses `reflection_text` + thesis, not market advice |
| **Regulation framing** | Copy and IA emphasize *response over reaction*, not *hold vs sell* | Aligns with pause-first stance in [active-surface.md](../ops/active-surface.md) |

---

## Explicit non-goals (stay in legacy / Tier B)

- Hold goal types, target months, price bands (`hold_goal_*` columns)
- Alignment / decision scoring tied to hold strategy ([stats-system.md](../systems/stats-system.md) legacy)
- “Set your commitment” onboarding flows tied to BTC targets

---

## Engineering notes when picking this up

1. **Schema:** likely new `profiles` JSON or text column (`why_thesis` / `pause_thesis`) — migration + RLS same as mantra.
2. **Home:** extend `HomeGoalWhyCard` or sibling component; keep section id `goal-why` unless storage migration.
3. **i18n / Customize:** rename labels from “anchor” / “why you stay” to “Your whys” consistently.
4. **AI:** any draft helper must go through existing reflect/orchestrate privacy patterns — no new edge without manifest updates.

---

## Related

- [screens/home.md](../screens/home.md) — anchor card wiring
- [home-practice-presence-xp.md](../systems/home-practice-presence-xp.md) — Presence tile (separate from whys)
