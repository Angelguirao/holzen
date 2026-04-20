# PostHog UI-level privacy hardening + Authorized URLs

**Status:** Open. Code-side privacy already locked down (`autocapture: false`, `disable_session_recording: true`, `person_profiles: 'identified_only'`, `sanitize_properties`). This ticket is the UI-side defense-in-depth so a future misconfigured deploy can't re-enable those features by accident.

## Why

Privacy posture in [`docs/ops/pii-masking-review.md`](../ops/pii-masking-review.md) rests on two layers:

1. **Client init flags** — already enforced in `src/lib/posthog.ts`.
2. **Project-level toggles** in the PostHog UI — not yet configured.

The second layer matters because flags in `posthog-js` can be re-enabled via a single line of JS. Project-level toggles are evaluated server-side at ingest and silently drop data regardless of what the client sends.

Separately, PostHog **Authorized URLs** (aka allowed origins) scope the public `VITE_POSTHOG_KEY` to our domains so a leaked key can't ingest events from an attacker's site.

## What to do

Both sections live in PostHog → gear icon (bottom-left) → **Project settings**.

### Privacy toggles (flip all four)

| Setting | Target |
|---|---|
| Autocapture | **Disabled** |
| Session recording | **Disabled** |
| Heatmaps | **Disabled** |
| Anonymize IPs | **Enabled** |

### Authorized URLs (paste one per line)

```
https://holzen.lovable.app
https://holzen.app
https://*.lovable.app
```

The wildcard covers preview branches. Remove it if preview builds should not send events (they currently share the production project).

## Verification

1. Open any Holzen page in an incognito window.
2. PostHog → Activity → Live events → filter to recent.
3. Confirm no `$autocapture`, `$rageclick`, or `$session_recording` event types appear — only explicit `track*` events from `src/lib/posthog.ts`.
4. Check a random event's properties: `$ip` should be missing or `0.0.0.0`.

## Related docs

- `docs/ops/pii-masking-review.md` — full privacy posture + consent model.
- `docs/ops/observability-setup.md` — PostHog section.
- `docs/ops/event-taxonomy.md` — the explicit event surface we _do_ want.
- `src/lib/posthog.ts` — the code-side flags this ticket backs up.
