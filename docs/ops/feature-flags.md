# Feature Flags

Feature flags run on **PostHog**. Evaluation is client-side only today; server-side evaluation is a backlog item.

**Hard rules**

1. **Every flag has a safe fallback.** If PostHog is unreachable, the app behaves like the flag is `false` (or its documented default).
2. **Flags never hard-fail user flows.** `useFeatureFlag` returns `{ value, loading, ready }`; render the safe path until `ready`.
3. **Every flag has a written sunset trigger.** If a flag has no clear "remove when X" criterion, it's tech debt. Don't merge it.
4. **Orphan flags are deleted quarterly.** A flag hidden behind `if (value === true)` for 3 months where both branches are equivalent = delete.

## Hook usage

```ts
import { useFeatureFlag } from '@/app/hooks/use-feature-flag';

const { value, ready } = useFeatureFlag('ui.home_v2', false);
if (!ready) return <HomeClassic />;  // safe fallback while PostHog boots
return value ? <HomeV2 /> : <HomeClassic />;
```

`value` is typed `boolean | string` for multivariate flags. Always pass a `defaultValue` matching the safe path.

## Active flags

| Key | Type | Default | Owner | Rollout | Purpose | Sunset trigger |
|---|---|---|---|---|---|---|
| `ui.home_v2` | boolean | `false` | @holzen | **0% / unused** | **Sunset (pause-first strip):** no call sites in active `src/`; safe to delete in PostHog when cleaning flags. Was a pipeline smoke test for alternate Home layout. | Delete from PostHog after one release with no references (already true on `feature/mvpPauseCleanup`). |
| `pause.step5_breath_label_shift` | boolean \| string | `false` | @holzen | 0% | Figma variant B: macro step 5 stepper label reads **Shift** instead of a second **Breathe**. | When design picks one variant for everyone; remove unused label branch. |

**Provisioning `pause.step5_breath_label_shift`:** create a boolean (or multivariate string) flag in the PostHog project with this exact key; until it exists, `isFeatureEnabled` stays on the client default (`false`). For local/Vite builds without flipping the flag in PostHog, you can set `**VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT**` to `1`, `true`, or `shift` in `.env` (see `.env.example`) — it overrides the label after PostHog is ready, or alone when PostHog is absent.

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
