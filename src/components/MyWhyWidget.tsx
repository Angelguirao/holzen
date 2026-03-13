import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { Heart, Anchor } from 'lucide-react';

export function MyWhyWidget() {
  const { motivations, mantra, groundingActivities } = useHolzen();
  const { t } = useTranslation();

  if (!mantra && motivations.length === 0 && groundingActivities.length === 0) return null;

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Heart className="h-2.5 w-2.5 text-primary/40" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
          {t('myWhy.title')}
        </p>
      </div>
      {mantra && (
        <p className="text-xs font-mono text-foreground/60 italic leading-relaxed">
          "{mantra}"
        </p>
      )}
      {motivations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {motivations.map((m) => (
            <span
              key={m}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/5 text-primary/60 border border-primary/10"
            >
              {t(`settings.motivations.${m}`, m)}
            </span>
          ))}
        </div>
      )}
      {groundingActivities.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Anchor className="h-2 w-2 text-muted-foreground/30" />
            <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/30">
              {t('myWhy.grounds', 'Grounds me')}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {groundingActivities.map((g) => (
              <span
                key={g}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/5 text-accent-foreground/50 border border-accent/10"
              >
                {t(`settings.grounding.${g}`, g)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
