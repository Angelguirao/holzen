import { useHolzen } from '@/hooks/use-holzen';
import { Heart } from 'lucide-react';

const MOTIVATION_LABELS: Record<string, string> = {
  freedom: 'Financial freedom',
  family: 'Family security',
  generational: 'Generational wealth',
  discipline: 'Learning discipline',
  conviction: 'Philosophical conviction',
  sovereignty: 'Self-sovereignty',
  inflation: 'Inflation hedge',
  curiosity: 'Curiosity',
};

export function MyWhyWidget() {
  const { motivations, mantra } = useHolzen();

  if (!mantra && motivations.length === 0) return null;

  return (
    <div className="rounded-md border border-border/40 bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Heart className="h-2.5 w-2.5 text-primary/40" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
          My Why
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
              {MOTIVATION_LABELS[m] || m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
