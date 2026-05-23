/**
 * CI cluster marker for `application/use-cases/session/` persisted tab session I/O (§3 / check:architecture-alignment).
 * Umbrella `pause-session-persisted-tab-session-flow` re-exports `persisted-tab-session` load/save/clear.
 * Presentation: `pause-persisted-tab-session-io` imports `persisted-tab-session` directly (not this umbrella).
 */
export {};
