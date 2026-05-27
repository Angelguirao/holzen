import { cn } from '@/lib/utils';

export type HaikuDisplayVariant = 'companion' | 'verse';

interface Props {
  haiku: string;
  /** `verse` — centered three-line stack (Reflect / Frame). `companion` — mono stack in cards. */
  variant?: HaikuDisplayVariant;
  className?: string;
}

/** Split stored haiku text (newline-separated) into display lines. */
export function parseHaikuLines(haiku: string): string[] {
  return haiku
    .split(/\\n|\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function HaikuDisplay({ haiku, variant = 'companion', className }: Props) {
  "use memo";
  const lines = parseHaikuLines(haiku);

  if (lines.length === 0) return null;

  const isVerse = variant === 'verse';

  return (
    <div
      className={cn(
        isVerse ? 'space-y-2 border-t border-border/40 py-3 text-center' : 'space-y-1 py-3',
        className,
      )}
      role="group"
      aria-label="Haiku"
    >
      {lines.map((line) => (
        <p
          key={line}
          className={cn(
            'leading-relaxed',
            isVerse
              ? 'font-editorial text-sm italic text-muted-foreground sm:text-base'
              : 'font-mono text-sm italic text-muted-foreground',
          )}
        >
          {line}
        </p>
      ))}
    </div>
  );
}
