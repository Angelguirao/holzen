import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { usePracticeSuggestion } from '@/hooks/use-practice-suggestion';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { TOOLS } from '@/lib/app-routes';
import { cn } from '@/lib/utils';
import type { SuggestedPracticeId } from '@/lib/practice-suggestion';

const FREE_PRACTICE: Record<SuggestedPracticeId, boolean> = {
  checkin: true,
  journal: false,
  bodyscan: false,
  replay: false,
};

/**
 * Copy + optional suggested practice + Tools link for the Home “Your pause” empty state.
 */
export function HomePauseEmptyBetweenContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribed, startCheckout } = useSubscription();
  const raw = usePracticeSuggestion(user?.id);
  const suggestion =
    raw && (subscribed || FREE_PRACTICE[raw.id]) ? raw : null;

  const handlePractice = useCallback(
    (id: SuggestedPracticeId) => {
      const route =
        id === 'checkin'
          ? TOOLS.practice.checkin
          : id === 'journal'
            ? TOOLS.practice.journal
            : id === 'bodyscan'
              ? TOOLS.practice.bodyscan
              : TOOLS.practice.replay;
      if (!FREE_PRACTICE[id] && !subscribed) {
        const descKey = `pro.desc_${id}`;
        const description = t(descKey) !== descKey ? t(descKey) : t('pro.upgradeDesc');
        toast(t('pro.featureLocked'), {
          description,
          action: { label: t('pro.upgradeCta'), onClick: () => void startCheckout() },
          duration: 6000,
        });
        return;
      }
      navigate(route);
    },
    [navigate, subscribed, startCheckout, t],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 text-center sm:text-left">
        <p className="text-sm font-medium leading-snug text-foreground">{t('home.pauseEmpty.title')}</p>
        <p className={cn(homeInWidget.bodyMuted, 'leading-relaxed')}>{t('home.pauseEmpty.subtitle')}</p>
      </div>

      {suggestion ? (
        <button
          type="button"
          onClick={() => handlePractice(suggestion.id)}
          className="flex w-full items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3 text-left transition-colors hover:bg-primary/[0.07]"
        >
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <span className={cn(homeInWidget.kicker, 'text-primary')}>{t('practice.suggested', { defaultValue: 'Suggested' })}</span>
            <span className={cn('mt-1 block leading-snug', homeInWidget.bodyMuted)}>{suggestion.reason}</span>
          </div>
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/40" aria-hidden />
        </button>
      ) : null}

      <Link
        to={TOOLS.hub}
        className="group inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/35 sm:justify-start"
      >
        {t('home.pauseEmpty.exploreTools')}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </div>
  );
}
