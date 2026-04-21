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
- Current default `0.0.0` is acceptable in decoupled mode.

## Current Policy

- Build identity: Git SHA (`__APP_VERSION__`) for diagnostics and correlation.
- Changelog version: product-facing semver in `changelog_entries.version`.
- `package.json` version: optional/cosmetic unless we adopt npm-style release workflows.

## Optional Strict Sync Mode

If we later want strict alignment, we can require:

- `package.json#version` == latest `changelog_entries.version`

This is not currently enforced because changelog entries are DB-managed and can be updated independently of build-time filesystem state.

## Release Checklist (Versioning)

Before publishing a new release:

1. Add/update changelog entry with the intended human version.
2. Ensure build uses a unique `__APP_VERSION__` (prefer Git SHA).
3. Ensure `SENTRY_RELEASE` (edges) matches frontend release identifier policy.
4. Verify Settings -> About shows:
   - `Changelog v<semantic version>`
   - build timestamp
   - release ID (SHA or fallback)
