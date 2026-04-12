/**
 * Shared typography + surfaces for content **inside** {@link HomeWidget}.
 * Keeps Market / Goal / Pause / etc. visually aligned with Library & Profile (sans body scale, one kicker style).
 */
export const homeInWidget = {
  body: 'text-sm leading-relaxed text-foreground',
  bodyMuted: 'text-sm leading-relaxed text-muted-foreground',
  meta: 'text-xs leading-snug text-muted-foreground',
  metaFaint: 'text-xs leading-snug text-muted-foreground/70',
  /** Row label — matches HomeWidget chrome (uppercase module tone) */
  kicker: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  kickerAccent: 'text-xs font-semibold uppercase tracking-wide text-primary/80',
  /** Large price / masked price line */
  price: 'text-2xl font-semibold tabular-nums tracking-tight text-foreground',
  priceHidden: 'text-2xl font-semibold tabular-nums tracking-tight text-muted-foreground/30',
  /** Secondary number under price */
  subPrice: 'text-sm font-medium tabular-nums text-muted-foreground',
  subPriceHidden: 'text-sm font-medium tabular-nums text-muted-foreground/30',
  /** Inset panel (nested card inside a widget) */
  inset: 'rounded-xl border border-border/40 bg-card/30 px-4 py-3',
  insetMuted: 'rounded-xl border border-border/40 bg-muted/30 px-4 py-3',
  /** Highlight strip (bulk actions, follow-up) */
  strip: 'rounded-xl border border-border/40 bg-muted/30 px-4 py-3',
  stripPrimary: 'rounded-xl border border-primary/20 bg-primary/5 px-4 py-3',
  /** Icon-only control */
  iconBtn: 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground',
  /** Full-width secondary row button */
  rowButton: 'flex w-full items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/30',
  /** List row with no default border (Practice list) */
  rowButtonGhost: 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/30',
  /** Motivation / tag chips (My Why, etc.) */
  chipTone: 'rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary/80',
} as const;
