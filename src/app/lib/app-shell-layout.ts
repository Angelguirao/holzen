/**
 * Authenticated four-tab shell width tiers (Phase 1).
 * @see docs/backlog/tablet-shell-width-evolution.md
 * @see docs/fundamentals/client-src-layout.md § Shell width and responsive layout
 */
export const APP_SHELL_WIDTH_CLASS = 'w-full max-w-sm md:max-w-md lg:max-w-lg';

/** Shell column in `AppLayout` — named container for opt-in `@…/shell:` layouts. */
export const APP_SHELL_ROOT_CLASS = `@container/shell ${APP_SHELL_WIDTH_CLASS}`;
