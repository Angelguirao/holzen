# Past reflections (user-words read model)

> **Pause V2 note:** this document predates the Pause V2 cutover and
> still describes the legacy `reflections` / `reflection_companions`
> model. The canonical runtime now lives on `pause_instances` + event
> tables + `pause_ai_artifacts`. See [`pause-system.md`](../pause-system.md)
> for the current data flow; the per-companion pages below are retained
> for historical context until each is rewritten.
>


A **shared read model** for surfacing a user's **own words from a past pause**. Used by two surfaces:

| Surface | Where | Uses |
|---------|-------|------|
| **Zoom Out · Echo** | Pause flow, reflect step | Picks one past pause with user words and shows it as "your words from {date}". |
| **Daily Practice · Replay** | `/practice/replay` | Loads a specific past pause and renders its **thread** (AI prompt → user notes/replays → new reply). |

Introduced 2026-04-18 to fix a long-standing honesty bug: Zoom Out's Echo card rendered `reflections.message` (the **AI-generated** reflect-step prompt) under the UI label "This is your own words from another day — not a new AI take." For users who had never typed a `note` or completed a Replay, Echo was 100% AI text behind a "your words" label.

---

## 1. What counts as "user words"

The model surfaces content from exactly **two** tables — never `reflections.message`:

| Source | Kind | Written when |
|--------|------|--------------|
| **`reflections.note`** | `note` | User types a free-text note on the reflect step (`ReflectionNote.tsx`). |
| **`practice_entries.body`** where `type = 'replay'` and `source_reflection_id = reflection.id` | `replay` | User writes a reply in Daily Practice's Replay flow (`ReflectionReplay.tsx`). |

Both are trimmed; blank / whitespace-only entries are dropped. A reflection with zero qualifying entries is excluded from the pool.

`reflections.message` (AI prompt from `holzen-reflect`) is kept **alongside** as `aiPrompt` — rendered as **context only** ("Holzen asked…") in Replay's thread view, never as the headline quote.

---

## 2. Read model

```ts
interface UserWord {
  kind: "note" | "replay";
  body: string;
  created_at: string;   // the reflection's created_at for notes; the entry's for replays
}

interface PastReflectionWithWords {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  context: string | null;
  aiPrompt: string | null;      // reflections.message — AI prompt, shown as context only
  userWords: UserWord[];        // chronological, oldest first; always non-empty in strict mode
}
```

Pure helpers live in [`supabase/functions/_shared/past-reflection-util.ts`](../../../supabase/functions/_shared/past-reflection-util.ts) and are exercised by [`src/test/past-reflection-util.test.ts`](../../../src/test/past-reflection-util.test.ts).

---

## 3. Data paths

| Caller | Entry point | Notes |
|--------|-------------|-------|
| **Zoom Out (edge)** | `fetchPastReflectionWithWords` in `supabase/functions/_shared/past-reflections.ts`; invoked from `generators/zoom-out.ts` | Strict — returns `null` if the user has no past pauses with words ≥3 days old. |
| **Replay (client)** | `usePastReflection(reflectionId)` in `src/hooks/use-past-reflection.ts` | Soft — when the reflection exists but has no words yet, returns a stub with `userWords: []` and `existsWithoutWords: true` so the UI can still render the AI prompt and invite a first entry. |

Both paths compose the same pure helpers so the shape is identical across surfaces.

---

## 4. Selection policy (strict Echo)

Zoom Out Echo's selection is:

1. Pull the 30 most recent reflections ≥3 days old.
2. Batch-load `practice_entries` with `source_reflection_id` in that set and `type = 'replay'`.
3. `assemblePastReflectionPool` pairs each reflection with its entries, builds `userWords`, and drops rows with zero entries.
4. Parse direction from today's `context` (`is up` / `is down`).
5. If the pool has direction-matching rows, prefer that subset; otherwise use the full pool.
6. Pick uniformly from the 10 most recent entries in the preferred subset (input order is preserved by the helper).

When the pool is empty, Echo returns `null` and the card renders an honest empty state ("You haven't left notes on past pauses yet…"). It never falls back to AI text.

---

## 5. Replay thread view

When Replay is opened from Zoom Out's "Continue the thread" CTA (or via `/practice/replay` with a `reflectionId`), it renders:

1. **Date header** + optional `context` row.
2. **`Holzen asked`** block with the AI prompt (`aiPrompt`).
3. **User words thread** — each `note` / `replay` in chronological order, labeled `Your note` or `Your replay` with its own date.
4. **Textarea + Done button** — the new entry is always written to `practice_entries` with `type = 'replay'` and `source_reflection_id` = this reflection's id, so it becomes the *next* entry in the thread on the next visit.

When opened without an id, Replay selects a random reflection ≥7 days old that **has a non-blank `note`** (preferring a thread-ready pause), falling back to the full pool and rendering the "you haven't written anything on this pause yet" line.

---

## 6. Backwards compatibility

- **Stored `reflection_companions` rows from before 2026-04-18** have the old `echo: { id, message, created_at, mood, outcome }` shape (`message` = AI text). These are read by `History.tsx`'s historical timeline and continue to render as before.
- **New payloads** include the old `message` field mirrored from `userWords[0].body`, so legacy consumers (`History.tsx`, `CompanionZoomOutPage`'s ReadTime + seed fallback) keep working and now show user text rather than AI text for fresh rows.
- **`ZoomOutDisplay`** is strict: even if `echo.message` is present without `userWords`, it treats the slot as empty and shows the nudge. Honesty over back-compat in the live card.

---

## 7. Key files

| File | Role |
|------|------|
| `supabase/functions/_shared/past-reflection-util.ts` | Pure helpers (`buildUserWordsForReflection`, `assemblePastReflectionPool`, `parseDirectionFromContext`, `pickPastReflection`). |
| `supabase/functions/_shared/past-reflections.ts` | Edge DB helper (`fetchPastReflectionWithWords`). |
| `supabase/functions/_shared/generators/zoom-out.ts` | Calls the edge helper; projects into the Echo payload. |
| `src/hooks/use-past-reflection.ts` | Client hook for a specific reflection id; used by Replay. |
| `src/components/practice/ReflectionReplay.tsx` | Replay thread view UI. |
| `src/components/ZoomOutDisplay.tsx` | Echo card with strict user-words policy + honest empty state. |
| `src/locales/en.json` | `companions.echo*` + `practice.replay*` strings (see `echoEmptyBody`, `echoHolzenAsked`, `replayNoWordsYet`). |
| `src/test/past-reflection-util.test.ts` | 13 tests covering the pure helpers. |

---

## 8. Related reading

- [zoom-out.md](companions/zoom-out.md) — end-to-end Zoom Out pipeline; §4 Step 2 links back here.
- [ai-powered-pause-system.md](ai-powered-pause-system.md) — full pause architecture.
- [navigating-the-codebase.md](../../fundamentals/navigating-the-codebase.md) — edge functions and hooks map.
