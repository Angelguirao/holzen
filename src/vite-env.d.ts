/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to `1` to enable all `[holzen:*]` client flow logs (and query cache logging) in non-DEV builds. */
  readonly VITE_HOLZEN_DEBUG?: string;
}
