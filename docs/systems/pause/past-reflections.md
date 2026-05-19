# Past pauses (user-words read model)

> **Not in shipped pause-first scope (2026-05).** `practice_entries` was dropped in cutover; Echo/Replay tools routes are legacy. Reference: tag `full-ia-pre-strip`. Shipped: [active-surface.md](../../ops/active-surface.md).

> **Pause V2:** User-word extraction now runs against pause events
> (`pause_step_events`) + `practice_entries`. There is no legacy
> `reflections` table post-cutover.

> **Pause archive:** qualifying rows come from **`v_pause_archive_*`** views over **`pause_instances`** (not a separate bookmark table). Echo and Replay below read **`pause_step_events`** / **`practice_entries`** where noted.

A **shared read model** for surfacing a user's **own words from a past pause**. Used by two surfaces:

| Surface | Where | Uses |
|---------|-------|------|
| **Zoom Out · Echo** | Pause flow, reflect step | Picks one past pause with user words and shows it as "your words from {date}". |
| **Daily Practice · Replay** | `/tools/practice/replay` | Loads a specific past pause and renders its **thread** (AI prompt → user notes/replays → new reply). |

Introduced 2026-04-18 to fix a long-standing honesty bug: Zoom Out's Echo card rendered the **AI-generated** prompt under the UI label "This is your own words from another day — not a new AI take." For users who had never typed a note or completed a Replay, Echo was 100% AI text behind a "your words" label.

---

## 1. What counts as "user words"

The model surfaces content from exactly **two** sources — never the AI prompt itself:

| Source | Kind | Written when |
|--------|------|--------------|
| **`pause_step_events`** (`step_type = 'note_updated'`) | `note` | User types a free-text note on the reflect step (`PauseNote.tsx`). |
| **`practice_entries.body`** where `type = 'replay'` and `pause_instance_id = pause.id` | `replay` | User writes a reply in Daily Practice's Replay flow (`ReflectionReplay.tsx`). |

Both are trimmed; blank / whitespace-only entries are dropped. A pause with zero qualifying entries is excluded from the pool.

The AI prompt (`pause_ai_artifacts.kind = 'reflection_text'`) is kept **alongside** as `aiPrompt` — rendered as **context only** ("Holzen asked…") in Replay's thread view, never as the headline quote.

---

## 2. Read model

```ts
interface UserWord {
  kind: "note" | "replay";
  body: string;
  created_at: string;   // the pause's `created_at` for notes; the practice entry's for replays
}

interface PastReflectionWithWords {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  context: string | null;
  aiPrompt: string | null;      // reflection_text artifact (AI prompt, shown as context only)
  userWords: UserWord[];        // chronological, oldest first; always non-empty in strict mode
}
```

Pure helpers live in [`supabase/functions/_shared/past-reflection-util.ts`](../../../supabase/functions/_shared/past-reflection-util.ts) and are exercised by [`src/test/past-reflection-util.test.ts`](../../../src/test/past-reflection-util.test.ts).

---

## 3. Data paths

| Caller | Entry point | Notes |
|--------|-------------|-------|
| **Zoom Out (edge)** | `fetchPastReflectionWithWords` in `supabase/functions/_shared/past-reflections.ts`; invoked from `generators/zoom-out.ts` | Strict — returns `null` if the user has no past pauses with words ≥3 days old. |
| **Replay (client)** | `ReflectionReplay.tsx` + `loadPauseReplayThread` | Full thread on **`/tools/practice/replay`**: picker or deep link from Echo; loads `v_pause_full` + events + `practice_entries`; saves new replay rows with `pause_instance_id`. |

The edge path (`fetchPastReflectionWithWords`) and the replay screen (`loadPauseReplayThread` in `src/lib/pause-replay-thread.ts`) both build `PastReflectionWithWords`: notes from `pause_step_events`, replay lines from `practice_entries` (`type = 'replay'`, `pause_instance_id`), merged via `combineNoteAndReplayWords` in `past-reflection-util.ts`.

---

## 4. Selection policy (strict Echo)

Zoom Out Echo's selection is:

1. Pull the 30 most recent **completed** pauses ≥3 days old (`v_pause_full`).
2. Batch-load `practice_entries` with `pause_instance_id` in that set and `type = 'replay'`.
3. Pair each pause with its note events (`pause_step_events.step_type='note_updated'`) and replay entries, build `userWords`, drop rows with zero entries.
4. Parse direction from today's `context` (`is up` / `is down`).
5. If the pool has direction-matching rows, prefer that subset; otherwise use the full pool.
6. Pick uniformly from the 10 most recent entries in the preferred subset (input order is preserved by the helper).

When the pool is empty, Echo returns `null` and the card renders an honest empty state ("You haven't left notes on past pauses yet…"). It never falls back to AI text.

---

## 5. Replay thread view

**Shipped:** `/tools/practice/replay` shows a **pause picker** (recent completed pauses) or opens a specific pause from Echo (`navigate` state). UI: date + context, **`Holzen asked`** (`aiPrompt`), chronological **notes and replays**, textarea to append a **`practice_entries`** row (`type = 'replay'`, `pause_instance_id` set). Empty user-word threads still show the prompt and invite a first replay line.

---

## 6. Pause V2 scope

Echo uses `v_pause_full` + `pause_step_events` / `practice_entries` only. There is no parallel read path through the legacy `reflections` table.

---

## 7. Key files

| File | Role |
|------|------|
| `supabase/functions/_shared/past-reflection-util.ts` | Types (`PastReflectionWithWords`, `UserWord`); `combineNoteAndReplayWords`, `mergeUserWordsChronological`, `parseDirectionFromContext`, `pickPastReflection`. |
| `supabase/functions/_shared/past-reflections.ts` | Edge DB helper `fetchPastReflectionWithWords`. |
| `supabase/functions/_shared/generators/zoom-out.ts` | Calls the edge helper; projects into the Echo payload. |
| `src/lib/pause-replay-thread.ts` | Client loader `loadPauseReplayThread` + pause picker query. |
| `src/legacy/full-shell/src/components/practice/ReflectionReplay.tsx` | Replay UI (legacy; not shipped). |
| `src/screens/pause/components/ZoomOutDisplay.tsx` | Echo card with strict user-words policy + honest empty state. |
| `src/locales/en.json` | `companions.echo*` + `practice.replay*` strings (see `echoEmptyBody`, `echoHolzenAsked`, `replayNoWordsYet`). |
| `src/test/past-reflection-util.test.ts` | Tests for merge helpers, `parseDirectionFromContext`, and `pickPastReflection`. |

---

## 8. Related reading

- [zoom-out.md](companions/zoom-out.md) — end-to-end Zoom Out pipeline; §4 Step 2 links back here.
- [ai-powered-pause-system.md](ai-powered-pause-system.md) — full pause architecture.
- [navigating-the-codebase.md](../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map.
