# Companion text-to-speech (Pro)

**Status:** backlog — not started.

**Scope:** **Companions** — read aloud for **Signal Full View** and other long-form companion content. **Pro-gated**.

---

## Goal

Let **Pro** users listen to companion text **in the browser** with acceptable quality and clear **controls** (play/pause, rate, voice where applicable).

## Direction

### Phase 1 — Browser `SpeechSynthesis`

- Use the **Web Speech API** (`window.speechSynthesis`, `SpeechSynthesisUtterance`) for **zero marginal cost** and no new secrets.
- Scope utterances to **visible article text** (title, body, optional “why this card” disclosure if expanded); skip chrome and **off-screen** nodes.
- Handle **`voiceschanged`**, **user gesture** requirements (some browsers), and **cancel** on navigation/unmount.

### Phase 2 — ElevenLabs (conditional)

- If **voice quality**, **language coverage**, or **consistency** is insufficient after Phase 1, add an **optional ElevenLabs** path (edge function + streaming or chunked audio) behind feature flag and **dashboard secrets**.
- Keep **browser TTS** as fallback for users without network, quota exhaustion, or unsupported locales.

## Links

- [signal.md §7 Full View](../systems/pause/companions/signal.md)
- [backlog.md](backlog.md) — index
