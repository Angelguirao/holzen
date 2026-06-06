import { cn } from '@/lib/utils';

/** Shared depth-choice card chrome (brief / deep) — Figma 589:19168. */
export const PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS = cn(
  'flex flex-col gap-4 rounded-lg border-2 border-border/80 bg-muted/30 px-4 py-8 text-center transition-colors',
  'hover:border-foreground/25 hover:bg-muted/40',
);
