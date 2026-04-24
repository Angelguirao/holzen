# Badges System

> **Status:** the "Recommended target model (skills-aligned badges)" at the
> bottom of this doc is **shipped** as the 4-family / 14-active model.
> `Profile > Badges` renders
> [`BadgesPanelV2`](../../src/components/BadgesPanelV2.tsx), definitions in
> [`src/lib/badges/definitions.ts`](../../src/lib/badges/definitions.ts),
> computation in [`src/lib/badges/compute.ts`](../../src/lib/badges/compute.ts).
> See [`pause-system.md`](pause-system.md) §10.
>
> The "Current App Order" section below is retained as historical context —
> it describes the legacy panel that was removed in the Pause V2 cutover.

## Current App Order (legacy, removed in Pause V2)

This document explains the badge system exactly as it worked **before the Pause V2 cutover** in `Profile > Badges`, in the same order users saw it.

## Data and counting rules used today

Badges are computed client-side from Pause V2 sources:
`v_pause_full`, `pause_step_events`, `pause_companion_events`, and
`practice_entries`, assembled in `use-badges.ts` before calling
`computeBadges`.

Current counting bases (see `src/lib/badges/compute.ts`):

1. **Any pause instance**: most badge counters use `v_pause_full` rows.
2. **Completed pause**: for “full ritual” requirements (breath + initial
   emotion + shift emotion + outcome + counted companion).
3. **Companion engagement**: `pause_companion_events.counts_for_pause`.
4. **Practice activity**: `practice_entries` for streak + practice-linked
   badges.

Important: all badge families now flow from Pause V2 events; the legacy
reflection-derived counters were removed at cutover.

---

## 1) Top summary strip (first thing on the tab)

## 1.1 Earned counter

- Displayed as: `earnedCount / totalBadges earned`
- `earnedCount = badges.filter(b => b.earned).length`
- `totalBadges = badges.length` (currently **32**)

## 1.2 Pro lock count

- If user is not subscribed, summary shows lock indicator with:
  - `proLockedCount = badges.filter(b => b.proOnly).length`
- Current pro-only count is **19**.

## 1.3 Overall progress bar

- Width = `earnedCount / totalBadges`.

## 1.4 Next badge callout

- Chooses first badge in declaration order where:
  - `earned === false`
  - `progress > 0`
- Displays badge name and progress (`current/requirement unit`).

---

## 2) Category sections and order

Category blocks are rendered in this fixed order:

1. `calendar`
2. `volume`
3. `composure`
4. `companions`
5. `engagement`

Each category header shows `catEarned / catTotal`.

---

## 3) Category 1: Bitcoin Calendar

All are non-Pro.

## 3.1 `btc-genesis`

- Requirement: paused at least once on Jan 3.
- Counter logic: binary `0/1` from date match.

## 3.2 `btc-birthday`

- Requirement: paused at least once on Jan 9.
- Counter logic: binary `0/1`.

## 3.3 `btc-pizza`

- Requirement: paused at least once on May 22.
- Counter logic: binary `0/1`.

## 3.4 `btc-whitepaper`

- Requirement: paused at least once on Oct 31.
- Counter logic: binary `0/1`.

## 3.5 `btc-halving`

- Requirement: paused within +/-3 days of any known halving date.
- Counter logic: binary `0/1` across configured halving date list.

---

## 4) Category 2: Pause Count

All are non-Pro and use **full-ritual pause count** (`completedRows` where
`counted_companion_count >= required_companion_count` in `computeBadges`).

## 4.1 `reflect-10`

- Requirement: `total >= 10`.

## 4.2 `reflect-50`

- Requirement: `total >= 50`.

## 4.3 `reflect-100`

- Requirement: `total >= 100`.

## 4.4 `reflect-500`

- Requirement: `total >= 500`.

---

## 5) Category 3: Composure

All are non-Pro and derived from completed pause rows in `v_pause_full`
(initial mood + outcome + context snapshot).

## 5.1 `calm-10`

- Counter: `calmCount = completed pauses where initial_mood === "calm"`.
- Requirement: `calmCount >= 10`.

## 5.2 `calm-50`

- Requirement: `calmCount >= 50`.

## 5.3 `held-10`

- Counter: `heldCount = completed pauses where outcome is "held" or "nothing"`.
- Requirement: `heldCount >= 10`.

## 5.4 `held-50`

- Requirement: `heldCount >= 50`.

---

## 6) Category 4: Companion Engagement (Pro)

All badges in this category are `proOnly`.

## 6.1 Breathing track

- `breathe-5`: `breathing_completed` count >= 5
- `breathe-25`: count >= 25
- `breathe-100`: count >= 100

## 6.2 Haiku track

- `haiku-10`: `haiku_read` count >= 10
- `haiku-50`: count >= 50

## 6.3 Grounding track

- `learn-10`: `grounding_read` count >= 10
- `learn-50`: count >= 50

## 6.4 Signal track

- `signal-10`: completed pauses where a counted companion event for `signal`
  occurred (counts from `pause_companion_events`) >= 10
- `signal-50`: count >= 50

## 6.5 Zoom Out track

- `zoom-5`: `zoom_out_read` count >= 5
- `zoom-25`: count >= 25

## 6.6 History track

- `history-5`: `history_read` count >= 5
- `history-25`: count >= 25

## 6.7 All companions in one pause track

- `all-6-5`: count of completed pauses where **all** counted companion types
  in the template are present (`counted_companion_count` >= `required_companion_count`
  and `counted_companion_types` covers the canonical companion list) >= 5
- `all-6-25`: same all-companions counter >= 25

Current all-companions condition checks:

- breathing completed
- haiku read
- grounding read
- signal source exists
- zoom out read
- history read

---

## 7) Category 5: Engagement (Pro)

All badges in this category are `proOnly`.

## 7.1 Favorites track

- `fav-5`: `is_favorite` count >= 5
- `fav-25`: count >= 25

## 7.2 Notes track

- `notes-10`: pauses with a note step (`pause_step_events.step_type = 'note_updated'`,
  `note_text` in `v_pause_full`) >= 10
- `notes-50`: count >= 50

---

## 8) Card-level UI states per badge

Each badge card can be in one of three effective states:

1. **Earned** (and not locked): earned styling + "Earned".
2. **In progress** (and not locked): progress bar + `current / requirement`.
3. **Locked** (`proOnly && !subscribed`): lock state with "Unlock with Pro".

When locked, progress details are hidden even if underlying counter is high.

---

## 9) Persistence, sync, and notifications

## 9.1 Earned sync to database

- Hook `useBadgeSync` compares currently-earned IDs to `user_badges`.
- New earned IDs are upserted into `user_badges` (`onConflict: user_id,badge_id`).

## 9.2 Celebration overlay

- Newly earned badges show celebration once per browser session.
- Session dedupe key: `holzen_badges_shown_this_session`.

## 9.3 Push notification flow

If badge notifications are enabled:

- Client invokes edge function `badge-notify` with newly earned badge metadata.
- Session token is refreshed if near expiry before invocation.
- Function sends push payload and marks `user_badges.notified_at`.

In parallel, DB notifications feed also receives badge items via trigger on `user_badges` inserts.

---

## 10) Current behavior summary

- Total badges: **32**
- Non-Pro badges: **13** (`calendar + volume + composure`)
- Pro badges: **19** (`companions + engagement`)
- Category render order: `calendar -> volume -> composure -> companions -> engagement`
- Badge evaluation order is declaration order in `BadgesPanel`; this order also controls "Next badge" selection.

---

## Recommended target model (skills-aligned badges)

To match a skills-first Stats model, badges should also map to the same skill language.

## A) Target badge architecture

Use 4 families:

1. **Foundation** (habit start and consistency)
2. **Core skills** (Regulation, Tolerance, Alignment, Reappraisal, Awareness)
3. **Mastery** (high-volatility and long-horizon proof)
4. **Legacy/Special** (calendar or seasonal, non-core)

## B) Badge-to-skill mapping (target)

- **Regulation**: mood recovery and calm-exit streak badges
- **Tolerance**: hold/nothing during drops and high-volatility moments
- **Alignment**: hold-goal-consistent decisions over windows
- **Reappraisal**: meaningful companion/tool usage with outcome stability
- **Awareness**: quality journaling/tagging/replay milestones

## C) Recommended active set size

- Target **12-16 active badges** max.
- Move most calendar/event badges into Legacy/Special.
- Consolidate per-companion count ladders into fewer meaningful depth badges.

## D) Progression strategy

- Keep early badges easy (first week, first hold, first full ritual).
- Middle badges should reward repeatable skill behavior.
- Late badges should reward high-volatility composure and sustained consistency.

## E) Pro gating recommendation

- Keep core progression mostly non-Pro.
- If gating is needed, gate depth/mastery extras, not core habit milestones.

## F) Migration path

### Phase 1

- Introduce new skill-aligned badges alongside current set.
- Keep old earned badges visible as Legacy.

### Phase 2

- Stop issuing non-core legacy badges for new users.
- Keep read-only display for historical earns.

### Phase 3

- Move eligibility logic server-side for anti-gaming consistency.
