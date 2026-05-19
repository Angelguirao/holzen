import { cn } from '@/lib/utils';

/**
 * Shared styles for multi-line writing (notes, journal, pause replays).
 * Keep in sync with inline editors that use {@link WritingField} with `disableFocusMode`.
 */
export const writingTextareaClassName = cn(
  'flex min-w-0 w-full max-w-full rounded-lg border border-input bg-background px-3 py-3',
  'text-sm leading-relaxed text-foreground placeholder:text-muted-foreground',
  'break-anywhere',
  'ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'resize-none transition-[border-color,box-shadow]',
);
