/**
 * CI cluster marker for `application/use-cases/session/` Holzen provider slice (§3 / check:architecture-alignment).
 * Umbrella `pause-session-providers-flow` re-exports `pickPauseHolzenProvidersSlice` from `pause-holzen-providers-slice`.
 * Presentation: `pause-session-providers-io` imports `pause-holzen-providers-slice` directly (not this umbrella).
 */
export {};
