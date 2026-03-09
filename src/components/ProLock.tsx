import { Lock } from 'lucide-react';
import { useProGate } from '@/hooks/use-pro-gate';
import { useTranslation } from 'react-i18next';

interface Props {
  children: React.ReactNode;
  /** If true, show inline lock badge instead of overlay */
  inline?: boolean;
}

/**
 * Wraps a section that requires Pro.
 * Shows a locked overlay with upgrade prompt for free users.
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
    <div className="relative">
      <div className="opacity-20 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Lock className="h-4 w-4 text-muted-foreground/40" />
        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {t('pro.badge')}
        </p>
        <button
          onClick={() => startCheckout()}
          disabled={checkoutLoading}
          className="text-[10px] font-mono text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
        >
          {t('pro.upgradeCta')}
        </button>
      </div>
    </div>
  );
}
