import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type SignalKeyIdeasBlockProps = {
  keyIdeas: string[];
  /** Frame accordion: show at most two teaser bullets. */
  variant?: 'full' | 'teaser';
  className?: string;
};

/** Figma Signal full-view KEY IDEAS list (product name stays Signal). */
export function SignalKeyIdeasBlock({ keyIdeas, variant = 'full', className }: SignalKeyIdeasBlockProps) {
  "use memo";
  const { t } = useTranslation();
  const items = variant === 'teaser' ? keyIdeas.slice(0, 2) : keyIdeas;
  if (items.length === 0) return null;

  return (
    <section className={cn('space-y-2', className)} aria-labelledby="signal-key-ideas-heading">
      <h3
        id="signal-key-ideas-heading"
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {t('companions.keyIdeasHeading', { defaultValue: 'Key ideas' })}
      </h3>
      <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
        {items.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </section>
  );
}
