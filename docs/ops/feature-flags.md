# Feature Flags

Two flag surfaces live in this repo, split by who needs to agree on the
value:

1. **PostHog feature flags** (documented below) — client-side, per-user,
   A/B-style gates for UI experiments.
2. **`app_config.feature_flags` jsonb** — a shared on/off map evaluated
   **identically** in browser + edge functions, used for cutovers and
   global kill switches. Migrations can read it; edge functions read it
   via `supabase/functions/_shared/app-config.ts`; the client reads it
   via `src/lib/pause-v2-flag.ts` (add similar helpers per flag). The
   value flips with a single SQL `UPDATE app_config SET value = …`.

Only use `app_config.feature_flags` when the flag gates DB triggers
and/or edge behavior *in addition to* UI — otherwise PostHog is the
default.

## Active `app_config.feature_flags` entries

| Key | Default | Surface | Purpose | Sunset trigger |
|---|---|---|---|---|
| `pause_v2_enabled` | `false` | DB triggers + edge cron + client hooks + Stats V2 + Badges V2 | Pause V2 cutover. When true, new pauses land in `pause_instances` + events + artifacts, Stats + Badges read from the new tables, and the legacy `notifications_from_reflections` + `notifications_from_pause_notifications` triggers skip to avoid double-emit. | Remove at Phase L (≥ 14 days of green post-cutover), together with the legacy `reflections` table and the branches that read this key. |

Feature flags run on **PostHog**. Evaluation is client-side only today; server-side evaluation is a backlog item.

**Hard rules**

1. **Every flag has a safe fallback.** If PostHog is unreachable, the app behaves like the flag is `false` (or its documented default).
2. **Flags never hard-fail user flows.** `useFeatureFlag` returns `{ value, loading, ready }`; render the safe path until `ready`.
3. **Every flag has a written sunset trigger.** If a flag has no clear "remove when X" criterion, it's tech debt. Don't merge it.
4. **Orphan flags are deleted quarterly.** A flag hidden behind `if (value === true)` for 3 months where both branches are equivalent = delete.

## Hook usage

```ts
import { useFeatureFlag } from '@/hooks/use-feature-flag';

const { value, ready } = useFeatureFlag('ui.home_v2', false);
if (!ready) return <HomeClassic />;  // safe fallback while PostHog boots
return value ? <HomeV2 /> : <HomeClassic />;
```

`value` is typed `boolean | string` for multivariate flags. Always pass a `defaultValue` matching the safe path.

## Active flags

| Key | Type | Default | Owner | Rollout | Purpose | Sunset trigger |
|---|---|---|---|---|---|---|
| `ui.home_v2` | boolean | `false` | @holzen | 10% | Pipeline smoke test on a low-stakes path (new Home layout). Validates: flag read, identify, sampling, client-side gating. | When V2 ships to 100% or is retracted (whichever first); remove after 2 stable weeks post-rollout. |

Add rows as flags are introduced. Bump rollout % via PostHog UI; document changes in the table.

## Naming convention

`<domain>.<short_key>` lowercase snake-case.

- ✅ `ui.home_v2`, `engine.skip_library_phase`, `paywall.show_yearly_first`
- ❌ `homeV2`, `new_home_page`, `experiment-1`

## Multivariate flags

PostHog supports string variants. Use for A/B/C tests where more than two cohorts need to see different UI:

```ts
const { value, ready } = useFeatureFlag('paywall.headline_variant', 'classic');
if (!ready) return <PaywallClassic />;
switch (value) {
  case 'benefit_first': return <PaywallBenefitFirst />;
  case 'price_first': return <PaywallPriceFirst />;
  default: return <PaywallClassic />;
}
```

Document each variant and its sunset criterion in the table.

## Privacy

Flag reads are associated with `distinct_id` = our internal `user_id`. No email, no PII. The feature flag request is the same call as PostHog's `/decide` endpoint — scrutinized under [pii-masking-review.md](pii-masking-review.md).

## When not to use a flag

- **Broken builds** — don't hide bugs behind a flag. Fix or revert.
- **Dead code** — a flag stuck at 0% for months is dead code. Delete both paths.
- **Config** — if every user should see the same value, it's config (env var or DB row), not a flag.

## Quarterly review

Every 3 months, walk the table:

1. Is the flag still at a rollout % other than 0% or 100%?
2. Is the sunset trigger still meaningful?
3. Is the flag referenced in code?

Archive stale flags in PostHog and remove the row.
