/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `1` to enable all `[holzen:*]` client flow logs (and query cache logging) in non-DEV builds. */
  readonly VITE_HOLZEN_DEBUG?: string;
  /** Sentry DSN for the frontend. Empty/unset = Sentry is disabled. */
  readonly VITE_SENTRY_DSN?: string;
  /** PostHog project API key. Empty/unset = PostHog is disabled. */
  readonly VITE_POSTHOG_KEY?: string;
  /** PostHog host; defaults to US cloud. */
  readonly VITE_POSTHOG_HOST?: string;
  /** App version (Git SHA in CI). Injected as `__APP_VERSION__`; also available via env. */
  readonly VITE_APP_VERSION?: string;
}

/** Build-time app version (Git SHA / "dev"). Shared with Sentry release + PostHog `$app_version`. */
declare const __APP_VERSION__: string;
/** Build-time ISO timestamp from vite.config.ts. */
declare const __BUILD_TIME__: string;
