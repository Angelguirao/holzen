# Versioning Policy

This project intentionally uses different version identifiers. They serve different audiences and should not be treated as interchangeable.

## Version Concepts

### 1) `package.json` version (product semver)

- Purpose: npm package metadata and human-facing release label in Settings → About.
- Example: `1.0.0`.
- Source of truth: `package.json` (`"version"` field).
- **Pause-first (2026-06):** no longer synced from `changelog_entries` (table dropped). Bump manually when shipping a user-visible release.

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

## Enforced Sync Guard

`npm run check:version-sync` (via `prebuild` on `npm run build`) validates that `package.json#version` is **valid semver**. It does **not** query Supabase.

Implementation: `scripts/check-version-sync.mjs`

## Release Checklist (Versioning)

Before publishing a new release:

1. Bump `package.json#version` when the release warrants a new product semver.
2. Ensure build uses a unique `__APP_VERSION__` (prefer Git SHA via CI / Vercel).
3. Ensure `SENTRY_RELEASE` / `EDGE_RELEASE` (edges) matches frontend release identifier policy.
4. Verify Settings → About shows build timestamp and release ID (SHA or fallback).

## Legacy

- **`changelog_entries` table** and in-app What's New changelog UI were removed in the pause-first strip (`20260611180000_pause_first_legacy_settings_schema_cleanup.sql`). Reference implementations live under `src/legacy/settings-changelog/`.
