# Personal thesis & “whys” — where depth lives

**Status:** Backlog (2026-06).  
**Context:** Pause-first Home anchor ([Wireframes 546:8945](https://www.figma.com/design/wFCCcvr3uOQRzwkjAfSiNI/Wireframes?node-id=546-8945)) = **mantra + motivations** (display). Hold goal / commitment → [`src/legacy/hold-goal/`](../../src/legacy/hold-goal/README.md).

**Practice stats glimpse (separate track):** [journey-practice-stats-evolution.md](journey-practice-stats-evolution.md).

---

## Should thesis-building belong in the pause flow?

**Yes — partially.** Thesis is not only Settings text; it becomes real when tied to **completed rituals**. But the **pause flow should activate and refine**, not replace, a stable identity layer.

| Layer | Surface | Responsibility |
|-------|---------|----------------|
| **Identity (stable)** | Settings → You; **read** on Home anchor | Mantra, motivation chips, future `pause_thesis` field — edited deliberately, low frequency |
| **Activation (episodic)** | `/pause` — especially **Reflect → Done** | Connect *this* moment to whys: optional one-liner, “does this still fit?” micro-prompt, never block completion |
| **Reflection (aggregate)** | **Journey** | How practice and stated whys evolved over weeks; version history if we ship it |
| **Corpus** | **Archive** | Per-pause artifacts (`reflection_text`), not thesis editing |

**Recommended pause touchpoints (in order of leverage):**

1. **Post-Reflect (engaged path)** — After user has language for the moment, optional: “Add one line to your thesis?” or “Save as echo” — **opt-in**, skippable, no gate on Continue.
2. **Done / ScoreImpact** — Qualitative copy can reference motivations/thesis (“You named what matters”) without new inputs.
3. **Brief ritual Done** — Lighter: confirm chip selections still resonate (yes/no), not long-form writing.
4. **Not in:** market trigger, breath timer, or first “Let’s pause” — too early; breaks regulation flow.

**Do not** turn `/pause` into onboarding for a 4-paragraph essay. Heavy authoring stays **Settings** or a dedicated **Journey → Your whys** subsection; pause flow only offers **frictionless captures** that append to thesis history.

---

## Product direction (future content)

Evolve whys toward a **durable personal thesis** — meaning and regulation, not portfolio strategy.

| Idea | Primary surface | Notes |
|------|-----------------|-------|
| **Rational thesis** | Settings + Journey read; **snippet** on Home | 2–4 sentences; Home shows first line or quote |
| **Structured whys** | Settings | Chips + per-chip “what this means to me” |
| **Thesis versioning** | Journey | Append-only timeline; privacy-sensitive |
| **Pause-linked echoes** | Post-Reflect opt-in | One sentence from `reflection_text` + thesis; AI draft via existing orchestrate privacy |
| **Regulation framing** | Copy everywhere | Response over reaction; no hold-duration advice |

---

## Explicit non-goals

- Hold goal types, price targets, alignment scoring ([stats-system.md](../systems/stats-system.md) legacy)
- Mandatory thesis step before `pause_completed`
- Investment “commitment” flows on Home

---

## Engineering notes

1. **Schema — user-authored (use Postgres):** `profiles.pause_thesis` (text) or JSON `{ body, updated_at }` — RLS same as `mantra`; edited in Settings, read on Home/Journey.
2. **Schema — ritual captures (optional Postgres):** `pause_thesis_snippets` or `pause_instances.metadata` entry when user saves a post-Reflect line — ties activation layer to identity.
3. **Schema — derived stats:** defer to [journey-practice-stats-evolution.md § When to add Postgres](journey-practice-stats-evolution.md#when-to-add-postgres); not required for first thesis UX.
4. **Domain:** `features/user/` for profile fields; `features/pause/application/` for “suggest thesis snippet from ritual” use case (no UI in infrastructure).
5. **Events:** any new capture → [event-taxonomy.md](../ops/event-taxonomy.md) (`pause.thesis_snippet_saved` etc.).
6. **Home:** keep anchor card **read-only** + link to Settings/Journey; no expand-to-edit on Home long term.

---

## Related

- [screens/home.md](../screens/home.md) — goal-why anchor
- [journey-practice-stats-evolution.md](journey-practice-stats-evolution.md) — Presence/Pauses drill-down
