# Personal grounding activities (legacy)

Profile tag list (`profiles.grounding_activities`) edited in **Settings → You** and forwarded to `holzen-reflect` during Reflect generation — **not shipped** in pause-first MVP.

## What moved here

- `GroundingTagInput.tsx` — tag editor UI

## Still shipped (unchanged)

- **Ground Yourself** companion (`companion_grounding`, library sources in Settings → Companions)
- `grounding-enrich` edge artifacts (separate legacy package)

## Re-enabling

1. Restore `GroundingTagInput` in `settings-you-panel.tsx`.
2. Re-expose `groundingActivities` / `setGroundingActivities` from `useProfile` and `useSettingsModel`.
3. Pass `groundingActivities` through `ReflectGenerationProfileInput` → `generateReflectionAtReflectStep`.
4. Optional: restore `landing.features.grounding` tile on `/welcome`.

DB column `profiles.grounding_activities` may still exist; active client no longer reads or writes it.

Active code must not import `@/legacy/personal-grounding/**`.
