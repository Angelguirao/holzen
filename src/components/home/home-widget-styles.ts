/**
 * Shared typography + surfaces for content **inside** {@link HomeWidget} and related Home chrome.
 * Keeps Market / Goal / Pause / etc. visually aligned: one body scale, one kicker, shared CTAs / dismiss / errors.
 */
export const homeInWidget = {
  body: 'text-sm leading-relaxed text-foreground',
  /** Reassurance / secondary body — Nox text-muted, not shadcn `primary` (inverse surface token). */
  bodyMuted: 'text-base leading-relaxed text-muted-foreground',
  meta: 'leading-snug text-muted-foreground text-sm',
  metaFaint: 'text-xs leading-snug text-muted-foreground/70',
  /** Row label — matches HomeWidget chrome (uppercase module tone) */
  kicker: 'uppercase tracking-wide font-normal text-muted-foreground text-xs',
  kickerAccent: 'text-xs font-semibold uppercase tracking-wide text-nox-text-highlight/90',
  /** Large price / masked price line */
  price: 'font-semibold tabular-nums tracking-tight text-nox-text-highlight text-xl',
  priceHidden: 'text-2xl font-semibold tabular-nums tracking-tight text-muted-foreground/30',
  /** Secondary number under price */
  subPrice: 'text-sm font-medium tabular-nums text-muted-foreground',
  subPriceHidden: 'text-sm font-medium tabular-nums text-muted-foreground/30',
  /** Inset panel (nested card inside a widget) */
  inset: 'rounded-xl border border-border/40 bg-card/30 px-4 py-3',
  insetMuted: 'rounded-xl border border-border/40 bg-muted/30 px-4 py-3',
  /** Highlight strip (bulk actions, follow-up) */
  strip: 'rounded-xl border border-border/40 bg-muted/30 px-4 py-3',
  stripPrimary: 'rounded-xl border border-border/50 bg-nox-background-accent/25 px-4 py-3',
  /** Icon-only control */
  iconBtn: 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground',
  /** Full-width secondary row button */
  rowButton: 'flex w-full items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-left transition-colors hover:bg-muted/30',
  /** List row with no default border (Practice list) */
  rowButtonGhost: 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/30',
  /** Motivation / tag chips (My Why, etc.) */
  chipTone:
    'rounded-full border border-border/50 bg-muted/35 px-2.5 py-[4px] text-xs font-medium text-foreground/90',
  /** Top-right dismiss on reflection / grounding previews */
  dismissAbs:
    'absolute -top-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-muted/50 hover:text-muted-foreground/60',
  /** Primary full-width action (Pause with this, Ground when subscribed) */
  ctaPrimary:
    'flex w-full items-center justify-center gap-2 rounded-xl border border-nox-border-default/60 bg-nox-background-accent/30 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-nox-background-accent/45',
  /** Stronger surface when the moment calls for it (e.g. volatile nudge) */
  ctaPrimaryEmphasis: 'border-nox-border-focus/45 bg-nox-background-accent/45 hover:bg-nox-background-accent/55',
  /** Muted full-width action (ground preview, stillness entry) */
  ctaSecondary:
    'flex w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/30 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/45',
  /** Inline error / retry blocks inside widgets */
  errorPanel: 'space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3',
  /** Short reflection teaser line */
  bodyLead: 'text-sm font-medium leading-relaxed text-foreground',
  /** Spinner + label row inside widgets */
  loadingRow: 'flex items-center gap-2 text-muted-foreground',
  /** Compact activity tags (Ground widget) */
  pillMuted: 'rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-muted-foreground text-xs',
  /** Next price-check countdown when auto cooldown is idle */
  nextScanCountdown: 'min-w-0 flex-1 text-base font-medium tabular-nums text-foreground',
} as const;
