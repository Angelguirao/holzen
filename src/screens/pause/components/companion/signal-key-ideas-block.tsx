import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type SignalKeyIdeasBlockProps = {
  keyIdeas: string[];
  /** `wireframe` = Figma full-view bordered panel; `teaser` deprecated (unused on Frame). */
  variant?: 'full' | 'wireframe' | 'teaser';
  className?: string;
};

/** Figma Signal full-view KEY IDEAS list (product name stays Signal). */
export function SignalKeyIdeasBlock({ keyIdeas, variant = 'full', className }: SignalKeyIdeasBlockProps) {
  "use memo";
  const { t } = useTranslation();
  const items = variant === 'teaser' ? keyIdeas.slice(0, 2) : keyIdeas;
  if (items.length === 0) return null;

  const heading = t('companions.keyIdeasHeading', { defaultValue: 'KEY IDEAS' });

  if (variant === 'wireframe') {
    return (
      <section
        className={cn(
          'w-full overflow-hidden rounded-2xl border-2 border-foreground px-4 pb-4 pt-2',
          className,
        )}
        aria-labelledby="signal-key-ideas-heading"
      >
        <div className="flex items-center gap-2 py-2">
          <Lightbulb className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
          <h3 id="signal-key-ideas-heading" className="text-base font-normal leading-6 text-foreground">
            {heading}
          </h3>
        </div>
        <ul className="list-disc space-y-2 pl-6 text-base leading-6 text-foreground marker:text-foreground">
          {items.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className={cn('space-y-2', className)} aria-labelledby="signal-key-ideas-heading-default">
      <h3
        id="signal-key-ideas-heading-default"
        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {heading}
      </h3>
      <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground">
        {items.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </section>
  );
}
