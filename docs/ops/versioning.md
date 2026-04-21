# Versioning Policy

This project intentionally uses three different version identifiers. They serve different audiences and should not be treated as interchangeable.

## Three Version Concepts

### 1) Changelog version (`changelog_entries.version`)

- Purpose: human-facing product release label (for "What's new").
- Example: `1.0.0`.
- Source of truth: rows in `public.changelog_entries`.
- Display: Settings -> About (`Changelog v...`).

### 2) Build/release ID (`__APP_VERSION__`)

- Purpose: technical deploy identifier for debugging and observability.
- Preferred value: current Git SHA.
- Used by:
  - Sentry `release` (frontend)
  - PostHog `$app_version`
  - Edge request header `x-app-version`
  - Feedback payload `app_version`
- Source of truth: `resolveAppVersion` in `vite.config.ts`.

Resolution order for `__APP_VERSION__`:

1. `VITE_APP_VERSION` (explicit override)
2. `git rev-parse --short=12 HEAD`
3. Fallback: `<package-version>-b<timestamp>`; if package version is placeholder `0.0.0`, use `build-b<timestamp>`
4. `dev` for non-build commands

## 3) `package.json` version

- Purpose: npm package metadata.
- In this repo (`"private": true`), this is not the production release source.
- It is still used as a consistency anchor for release hygiene.

## Current Policy

- Build identity: Git SHA (`__APP_VERSION__`) for diagnostics and correlation.
- Changelog version: product-facing semver in `changelog_entries.version`.
- `package.json` version: synced to the latest changelog version (guarded at prebuild).

## Enforced Sync Guard

This repo now enforces:

- `package.json#version` must equal the latest `changelog_entries.version`

Implementation:

- Script: `scripts/check-version-sync.mjs`
- npm command: `npm run check:version-sync`
- `prebuild` hook runs the check automatically before `npm run build`

The guard queries Supabase (`changelog_entries` ordered by `created_at DESC LIMIT 1`) using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (with project fallbacks).

## Release Checklist (Versioning)

Before publishing a new release:

1. Add/update changelog entry with the intended human version.
2. Update `package.json#version` to the same value.
3. Ensure build uses a unique `__APP_VERSION__` (prefer Git SHA).
4. Ensure `SENTRY_RELEASE` (edges) matches frontend release identifier policy.
5. Verify Settings -> About shows:
   - `Changelog v<semantic version>`
   - build timestamp
   - release ID (SHA or fallback)
