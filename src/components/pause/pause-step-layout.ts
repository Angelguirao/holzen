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
  /** @deprecated Prefer `ritualPrimaryCta` + `<Button variant="default" />` for ritual forwards. */
  textContinue:
    'text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline',

  /**
   * Filled primary ritual pill — use with `<Button variant="default" className={pauseStepLayout.ritualPrimaryCta} />`
   * (e.g. Continue after breath, Reflect, Decide mirror confirm, Choose bridge, Integrate, Done return).
   */
  ritualPrimaryCta: 'rounded-full px-8',

  /**
   * Primary-outline ritual pill — use with `<Button variant="outline" className={pauseStepLayout.ritualPrimaryOutlineCta} />`
   * (e.g. Feel Continue, Breathe Start).
   */
  ritualPrimaryOutlineCta:
    'rounded-full border-primary bg-primary/5 px-6 py-2.5 font-medium text-primary hover:bg-primary/10 hover:text-primary disabled:opacity-60',

  /**
   * Muted outline pill for secondary forward CTAs — use with `<Button variant="outline" />` (e.g. Frame “I'm done”).
   */
  ritualMutedOutlineCta:
    'rounded-full border-border bg-muted/40 px-6 py-2 text-foreground hover:bg-muted/55 hover:text-foreground',
} as const;
