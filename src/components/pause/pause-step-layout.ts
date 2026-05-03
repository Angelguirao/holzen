/**
 * Shared layout and type scale for `/pause` session steps so Feel → Decide read as one flow.
 */
export const pauseStepLayout = {
  /** Centered steps: Feel, Shift, Decide, Breathing (outer). */
  columnCenter: 'flex w-full min-h-[52vh] flex-col items-center justify-center gap-8',
  /** Done screen: slightly taller, more vertical air. */
  columnDone: 'flex w-full min-h-[56vh] flex-col items-center justify-center gap-10 text-center',
  /** Reflect: full-width content inside scaffold `max-w-lg`. */
  columnFlow: 'mx-auto flex w-full flex-col gap-8 pb-4',
  /** Top-aligned column: brief Feel step. */
  columnTop: 'flex w-full flex-col items-stretch gap-8 pt-4 pb-4',
  screenTitle: 'max-w-md text-center font-editorial text-xl leading-snug text-foreground sm:text-2xl',
  screenSubtitle: 'mx-auto max-w-sm text-center text-sm leading-relaxed text-muted-foreground',
  backRow: 'flex justify-center pt-1',
  backButton: 'flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground',
  textContinue: 'text-sm font-medium text-primary underline-offset-4 hover:underline',
} as const;
