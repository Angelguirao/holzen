import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useProGate } from '@/hooks/use-pro-gate';
import { useTranslation } from 'react-i18next';
import type { ProFeature } from '@/lib/pricing';

interface Props {
  children: React.ReactNode;
  /** If true, show inline lock badge instead of overlay */
  inline?: boolean;
  /** Feature key for contextual description */
  feature?: ProFeature | string;
  /** If true, hide the blurred children entirely and show only the CTA */
  hideContent?: boolean;
}

/**
 * Wraps a section that requires Pro.
 * Shows children with a gradient fade + lock overlay so free users
 * can glimpse what they're missing, but can't interact.
 */
export function ProLock({ children, inline, feature, hideContent }: Props) {
  const { isPro, isPending, startCheckout, checkoutLoading } = useProGate();
  const { t } = useTranslation();

  if (isPro) return <>{children}</>;
  if (isPending) return <div className="rounded-md bg-muted/20 animate-pulse min-h-[60px]" />;
  // Resolve contextual description
  const descKey = feature ? `pro.desc_${feature}` : '';
  const contextualDesc = feature && t(descKey) !== descKey ? t(descKey) : null;
  const fallbackDesc = t('pro.upgradeDesc');

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
      {!hideContent && (
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="opacity-30 blur-[2px] max-h-[280px] overflow-hidden">
            {children}
          </div>
          {/* Gradient fade to obscure bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
      )}

      {/* Upgrade CTA overlay */}
      <div className={`${hideContent ? 'py-8' : 'absolute inset-0'} flex flex-col items-center justify-center gap-3`}>
        <Lock className="h-6 w-6 text-[#dbb266]" />
        <h2 className="font-semibold text-foreground text-base">{t('pro.featureLocked')}</h2>
        <p className="max-w-xs leading-relaxed text-muted-foreground text-center text-sm">
          {contextualDesc || fallbackDesc}
        </p>
        <button
          onClick={() => startCheckout()}
          disabled={checkoutLoading}
          className="group inline-flex items-center gap-1.5 font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline disabled:opacity-50 text-base font-sans"
        >
          {t('pro.upgradeCta')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
