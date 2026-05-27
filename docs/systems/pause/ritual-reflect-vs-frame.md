# Deep pause ritual — Reflect vs Frame (product intent)

**Status:** Canonical product framing (May 2026).  
**Audience:** Product, design, and engineering deciding what belongs on each deep-pause beat.  
**Scope:** **Deep pause only** (`Feel → Breathe → Reflect → Frame → Breathe₂ → Decide`). Brief pause has no Reflect/Frame — see [pause-system.md](../pause-system.md) §7.1.

**Technical companions:** [ai-powered-pause-system.md](ai-powered-pause-system.md) · **Reflect v2 implementation:** [reflect-step-redesign-spec.md](reflect-step-redesign-spec.md) · **Lifecycle contract:** [pause-system.md](../pause-system.md) §7.

---

## 1. Why this document exists

The stepper labels **Reflect** and **Frame**, but it is easy to conflate them:

- Users expect **Reflect** to mean “think about what’s going on for *me*.”
- **Frame** shows companion tools (Signal, Grounding, History, Zoom out) that feel like “where the real content is.”
- Older builds pushed all teaching and market context to Frame (and featured intervention), so Reflect often felt like **regulate only** — calm copy without inquiry.

This one-pager states **what each beat is for**, **what the user should be doing**, and **a simple rule** for placing new UI or AI without moving heavy companions into Reflect.

---

## 2. One-line definitions

| Beat | Product job | User-facing question |
|------|-------------|----------------------|
| **Reflect** | **Internal** meaning-making after the first breath | “What set me off? What story am I telling myself?” |
| **Frame** | **Optional external** lenses — open only if wanted | “Do I want another angle from the world (news, science, history, zoom-out)?” |

**Decision test:** If it helps the user **name their own trigger or story**, it belongs in **Reflect**. If it helps them **reframe with external knowledge** (cited, researched, long-form), it belongs on **Frame** (companion full views).

---

## 3. Ritual arc (deep pause)

The deep ritual moves **inward → optional outward → re-regulate → commit**:

```text
Feel          →  name raw state
Breathe (1)   →  downshift nervous system
Reflect       →  internal inquiry (Land + Name-it + optional light context)
Frame         →  optional companion hub (lazy; skippable with “I’m done”)
Breathe (2)   →  steady before action
Decide        →  behavioral outcome (held / bought / sold)
```

**Feel** and **first Breathe** are prerequisites for calm enough to reflect honestly. **Frame** is not required for completion — users can skip all companions. **Decide** is the only step that must complete the pause in Postgres (`outcome_logged`).

---

## 4. Reflect — what it is for

### 4.1 User job

After breathing, the user should spend one beat on **their** experience:

1. **Trigger** — What happened *for them* (notification, chart, argument, boredom), not only “BTC −4%.”
2. **Story** — The narrative under the mood (“I’ll lose everything,” “I’ll miss the move,” “I failed last time”).
3. **Inquiry** — One question that preserves agency (no advice, no “you should”).

Reflect is **not** homework. One **Continue** exits the step; there is no requirement to open companions.

### 4.2 Shipped UI shape (May 2026 — one letter)

The Reflect card shows:

| Surface | Purpose |
|---------|---------|
| **Feel recap** (muted line) | “You said: …” from this pause’s Feel step — always visible when mood is known. |
| **One letter** | Single `message` from `holzen-reflect` (v8 prompt) — land + hypothesis + inquiry woven in one voice; at most one line break before the closing question. |
| **Haiku** (optional) | Small italic aside below the letter — not part of the reflection copy. |
| **Market context** (collapsed) | Raw telemetry + optional narrative strip — **hidden by default**; not mixed into the letter. |
| **Your note** (Pro, below card) | Post-it / tags — clearly separate from AI copy. |

Structured `land` / `hypothesis` / `inquiry` remain in the artifact for analytics; the UI does not render them as separate blocks. See [reflect-step-redesign-spec.md](reflect-step-redesign-spec.md) for generation detail.

### 4.3 What Reflect must not become

- Cited articles or “why markets moved” deep dives → **Signal** on Frame.
- Bias / behavioral-science essays with sources → **Grounding** on Frame.
- Past-self mirror narratives → **History** on Frame (or legacy featured intervention).
- Trading advice, price targets, or repeated % moves in prose.

**Rationale:** Reflect should stay **one fast edge round-trip** (`holzen-reflect`) right after Breathe. Heavy Perplexity companions belong where the user **opts in** and accepts latency/cost.

### 4.4 AI contract (summary)

- **Edge:** `holzen-reflect` → `pause_ai_artifacts` (`reflection_text` v2 JSON: land, hypothesis, inquiry, optional context).
- **Inputs that matter:** This pause’s **Feel** mood/intensity/tile, profile tone, market context for tone only (not for teaching).
- **Prompt stance:** Validate and inquire; **do not** teach or inform on Reflect (that boundary keeps Frame distinct).

---

## 5. Frame — what it is for

### 5.1 User job

Frame is a **hub**, not a second Reflect screen:

- Subtitle intent: *“Want another angle? Your companions.”*
- Rows link to full-view companions (`/companion/signal|grounding|history|zoom-out/:pauseInstanceId`).
- **I’m done** logs `shift_emotion_logged` with `{ from_frame_hub: true }` and advances to second Breathe — no mirror mood required.

The user has already had an internal beat on Reflect. Frame answers: **“Do I still want external perspective?”**

### 5.2 Companion roles (stay on Frame)

| Companion | Frame job | Why not Reflect |
|-----------|-----------|-----------------|
| **Signal** | Cited reappraisal / “why markets move” | Perplexity + URLs; long read; user-initiated |
| **Grounding** | Bias / science nudge with enrichment | Same; overlaps with “teach” boundary |
| **History** | Past-self / historical insight | Narrative depth; optional |
| **Zoom out** | Long-horizon / cosmic framing | Optional perspective layer |

**Shipped behavior:** Content generates **on tap** (`companion-orchestrate`, lazy fetch). Nothing runs at mount — Frame stays cheap and skippable.

### 5.3 Optional haiku on Frame

Haiku may appear in a collapsible card on Frame (lazy-loaded). It mirrors Reflect’s optional haiku pattern: **optional delight**, not a cognitive requirement.

### 5.4 Featured intervention (quarantined)

The old **headline intervention** (mirror / trap / pattern / question at top of Frame) is **not shipped** in pause-first UI. Code lives in `src/legacy/pause-featured-intervention/` and `supabase/functions/legacy/featured-intervention/`. Frame today is **companion hub only** — do not conflate with that legacy surface when reading older docs or reviews.

---

## 6. Should anything move from Frame to Reflect?

**Default: no** for Signal, Grounding, History, Zoom out.

| Content | Reflect | Frame |
|---------|---------|-------|
| Feel recap (“You said fearful 4/5…”) | Yes | No |
| One inquiry question | Yes | No |
| 1–2 sentence Land / calm | Yes | No |
| Non-cited context strip (“often people think…”) | Yes (collapsed) | No |
| Cited market narrative | No | Signal |
| Bias / research deep dive | No | Grounding |
| Past-self story | No | History |
| Long-horizon zoom-out copy | No | Zoom out |

The only “companion-like” material that belongs in Reflect is the **idea** of grounding — a **single question or hypothesis**, not the Grounding companion UI.

If analytics show users **never** open Signal but stall on Reflect, strengthen the **context strip** on Reflect (templates / cron blurbs) — not by moving Signal earlier.

---

## 7. Brief pause (contrast)

**Brief:** `Feel → Breathe → Integrate → Decide` — no Reflect, no Frame, no second breath.

Integrate is a **client-only quiet window** (no companion RPC). Do not use Brief to judge whether Reflect/Frame split works; deep pause is the reference path.

---

## 8. Copy and UX guardrails

When writing or reviewing Reflect / Frame:

1. **Reflect** subtitles and body copy should emphasize **inward** language (you, your story, your fear) — not “here’s what happened in markets.”
2. **Frame** subtitles should emphasize **optional** and **angle** — not “complete your reflection here.”
3. **Continue** on Reflect must not imply companions are required next.
4. **I’m done** on Frame must feel like a valid success path, not failure to explore.
5. Shell **back** on Reflect is hidden (Continue-only); from Frame, back returns to Reflect for users who want to re-read Name-it — see [pause-system.md](../pause-system.md) §7.4.

---

## 9. Metrics (suggested)

Use these to validate the split, not to merge steps:

| Signal | Healthy interpretation |
|--------|-------------------------|
| Time on Reflect before Continue | Users sitting with Name-it / inquiry |
| % sessions with **zero** Frame companion opens | Skipping Frame is OK |
| Signal open rate from Frame | Frame doing its job for users who want external context |
| Decide outcomes × companion usage | Correlation only — companions are optional by design |

---

## 10. Related implementation map

| Surface | Code |
|---------|------|
| Reflect step | `src/screens/pause/components/PauseReflect.tsx`, `pause-reflect-card.tsx` |
| Frame hub | `src/screens/pause/components/PauseFrame.tsx` |
| Reflect generation | `holzen-reflect` edge; `use-pause-reflect-generation` |
| Companion lazy fetch | `useCompanionOrchestration` → `companion-orchestrate` |
| Legacy intervention | `src/legacy/pause-featured-intervention/` (not in active bundle) |

---

## 11. When to update this doc

Update this file when you:

- Change stepper labels or the Reflect/Frame **product promise** in copy.
- Add a new companion or move content across the inward/outward boundary.
- Ship mandatory UI on Frame that effectively blocks “I’m done” without reading.
- Re-enable featured intervention or merge Reflect + Frame into one beat.

For schema, RPC, and step order changes, also update [pause-system.md](../pause-system.md) §7 and [ai-powered-pause-system.md](ai-powered-pause-system.md).
