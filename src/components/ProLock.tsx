import { Lock, Sparkles } from 'lucide-react';
import { useProGate } from '@/hooks/use-pro-gate';
import { useTranslation } from 'react-i18next';

interface Props {
  children: React.ReactNode;
  /** If true, show inline lock badge instead of overlay */
  inline?: boolean;
}

/**
 * Wraps a section that requires Pro.
 * Shows children with a gradient fade + lock overlay so free users
 * can glimpse what they're missing, but can't interact.
 */
export function ProLock({ children, inline }: Props) {
  const { isPro, isPending, startCheckout, checkoutLoading } = useProGate();
  const { t } = useTranslation();

  if (isPending || isPro) return <>{children}</>;

  if (inline) {
    return (
      <button
        onClick={() => startCheckout()}
        disabled={checkoutLoading}
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Lock className="h-2.5 w-2.5" />
        <span className="uppercase tracking-wider">{t('pro.badge')}</span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md">
      {/* Teaser peek — visible but non-interactive */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="opacity-30 blur-[2px] max-h-[280px] overflow-hidden">
          {children}
        </div>
        {/* Gradient fade to obscure bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Upgrade CTA overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-2 bg-muted/60 backdrop-blur-sm border border-border/40 rounded-full px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
            {t('pro.badge')}
          </span>
        </div>
        <button
          onClick={() => startCheckout()}
          disabled={checkoutLoading}
          className="text-xs font-mono text-primary/80 hover:text-primary underline underline-offset-4 decoration-primary/30 hover:decoration-primary/60 transition-all"
        >
          {t('pro.upgradeCta')}
        </button>
      </div>
    </div>
  );
}
