# PII Masking Review — PR Checklist

Use this for every PR that changes: user-facing components, Sentry wiring, PostHog events, edge log emission, or alert copy. Holzen stores reflection text and financial context — treat all three as sensitive.

## Non-negotiables

1. **Reflection text, prompt text, companion content, and message bodies never leave our systems into third-party vendors.**
2. **User identification is `user_id` only.** Never email, name, phone, provider claims.
3. **Field masking is belt-and-braces.** `beforeSend`/`sanitize_properties` scrubbers are the last line of defense, but code should not pass sensitive fields in the first place.

## Frontend — Sentry

- [ ] Any new `Sentry.captureException` / `captureMessage` call inspects its `extra`/`contexts` for sensitive keys. Never pass `reflection.message`, `prompt`, `companion.content`, `body`, `input`.
- [ ] Any user-facing form input that might be auto-captured by Sentry Replay has `data-sentry-mask` on the field, or its surrounding container.
- [ ] Radix portals (dialogs, popovers, selects) that render over masked content are themselves masked by default via our Replay config (`maskAllText`, `maskAllInputs`). Do not override with `data-sentry-unmask` on a container that includes user input.
- [ ] `networkDetailAllowUrls` in the Replay integration stays empty. No endpoint should stream request/response bodies to Sentry.
- [ ] `beforeSend` patterns list in `src/lib/sentry.ts` covers any new PII-bearing keys you introduced.
- [ ] `beforeBreadcrumb` is still dropping `console.*` entries that match the scrubber pattern.
- [ ] User context uses `Sentry.setUser({ id })` only — never `email`, `name`, or claims.

## Frontend — PostHog

- [ ] **Every new event** is listed in [event-taxonomy.md](event-taxonomy.md) with its property schema. Undocumented events get deleted in review.
- [ ] Properties never include: reflection text, prompt text, email, full company/user name, full URL with query strings that carry identifying data.
- [ ] New properties run through `sanitize_properties` (`src/lib/posthog.ts`). Confirm the key-pattern filter still catches them if they're sensitive.
- [ ] `autocapture: false` is still set. If anyone tried to flip it on, reject the PR.
- [ ] `session_recording.disabled: true` is still set. Same rule.
- [ ] `person_profiles: 'identified_only'` — no anonymous profiles.
- [ ] If a feature flag gates sensitive UI, confirm the flag key is not logged with PII properties alongside it.

## Edge logs

- [ ] No `log()` or `logger.info/warn/error` call in a new code path passes a key matching `prompt|reflection|content|message|body|input` in `extra`. Use an ID (`pause_instance_id`, `companion_id`) and/or a short stable hash.
- [ ] `logDependencyCall` does not log full request/response bodies for LLM calls. Spec-only (`service`, `op`, `model`, `tokens`, `duration_ms`, `cost_usd`).
- [ ] `EdgeError.context` does not include PII. It can include IDs and stable codes.
- [ ] `observe.ts` forwarder still drops content fields before HTTP-POSTing to BetterStack (no overrides that add new fields to the serialized entry without running them through the same filter).

## Edge Sentry

- [ ] New errors thrown from edges are `EdgeError` with a typed `code`. User-input classes (`auth_required`, `rate_limited`, `bad_input`, `not_found`) are in the skip-list → no Sentry issue created. Internal failures (`upstream_error`, `internal_error`, `quality_gate_failed`, `upstream_timeout`) DO create issues.
- [ ] `scrubPiiEdge` in `supabase/functions/_shared/sentry.ts` mirrors the frontend `beforeSend` patterns. If you add a new PII key in a frontend scrubber, add it here too (see `supabase/functions/_shared/pii-patterns.ts` — shared source).
- [ ] Server `tracesSampleRate: 0`. Replay is never enabled on Deno.

## Slack alerts

- [ ] Feedback forwarder payload **only** sends: category, page path, `cid`, app version. Never message text, never user agent (identifying via fingerprint), never user id.
- [ ] Sentry Slack alerts use the default summary (title, release, count). Custom copy must not include stack frame variables that could carry user text.
- [ ] BetterStack alert messages are query-driven (level/msg). If you introduce a new rule that templates log fields into the Slack body, double-check that field isn't sensitive.

## Audit log

- [ ] `logAudit` calls include actor/action/target IDs and the `cid`. `before`/`after` JSON may contain non-PII operational state (e.g. subscription plan, admin flag). It **must not** contain reflection/prompt content.
- [ ] `audit_log` RLS policy is Admins-only for SELECT. No INSERT/UPDATE policies beyond service role.

## Deletion (GDPR)

- [ ] When `delete-account` runs, it purges: Sentry user contexts (via `Sentry.setUser(null)` at sign-out — note: past events stay in Sentry up to retention window), PostHog person (see `posthog.api/person-deletion` — confirm CLI or API task is in backlog), DB rows per existing delete flow, audit log is NOT purged (required for compliance audit trail; no direct PII in it by contract).
- [ ] New tables added with `user_id` → update `delete-account/index.ts` in the same PR.

## Pre-PMF vs post-PMF

If we later need **Session Replay with consent** or **any new recording surface**, update this doc with the gate logic and re-run a full privacy review (DPA, consent gate, UX copy). Until then, no toggle.
