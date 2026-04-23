import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Sparkles, Wind, Brain, Infinity, Anchor, Lightbulb, BookOpen, Moon, Image, Mail, MessageSquare, Zap, Coins } from 'lucide-react';
import { PRICING } from '@/lib/pricing';

interface Props {
  motivations: string[];
  groundingActivities: string[];
  threshold: number;
  onBeginFree: () => void;
  onStartTrial: () => void;
  checkoutLoading: boolean;
  stagger: (delay: number) => object;
}

export function OnboardingReady({
  motivations,
  groundingActivities,
  threshold,
  onBeginFree,
  onStartTrial,
  checkoutLoading,
  stagger,
}: Props) {
  const { t } = useTranslation();

  const recapItems = [
    motivations.length > 0 && {
      label: t('onboarding.ready.recapWhy', 'Your why'),
      value: motivations.map((m) => t(`settings.motivations.${m}`, m)).join(', '),
    },
    groundingActivities.length > 0 && {
      label: t('onboarding.ready.recapGrounding', 'Grounds you'),
      value: groundingActivities.slice(0, 3).join(', ') + (groundingActivities.length > 3 ? '…' : ''),
    },
    {
      label: t('onboarding.ready.recapThreshold', 'Threshold'),
      value: `${threshold.toFixed(1)}%`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.ready.title', "You're set")}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      {/* Recap chips */}
      {recapItems.length > 0 && (
        <motion.div className="space-y-2" {...stagger(0.15)}>
          {recapItems.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <span className="text-[10px] font-mono tracking-wide uppercase text-muted-foreground/50 shrink-0">
                {item.label}
              </span>
              <span className="text-xs font-mono text-foreground/70 text-right truncate">
                {item.value}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Free vs Pro comparison */}
      <motion.div className="space-y-4" {...stagger(0.25)}>
        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40">
            {t('onboarding.ready.freePlan', 'Free')}
          </p>
          {[
            { icon: Wind, text: t('onboarding.ready.featurePauses', '{{count}} pauses per month', { count: PRICING.freeReflectionsPerMonth }) },
            { icon: Brain, text: t('onboarding.ready.featureAI', 'AI companions in every pause') },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <span className="text-xs text-muted-foreground/60 leading-snug">{text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-foreground/60">
            {t('onboarding.ready.proPlan', 'Pro · ${{price}}/mo', { price: PRICING.monthlyPrice })}
          </p>
          {[
            { icon: Infinity, text: t('onboarding.ready.proUnlimited', 'Unlimited pauses') },
            { icon: Anchor, text: t('onboarding.ready.proGrounding', 'AI-guided grounding & stillness') },
            { icon: Lightbulb, text: t('onboarding.ready.proInsights', 'AI pattern insights across pauses') },
            { icon: Moon, text: t('onboarding.ready.proNight', 'Evening reflection prompts') },
            { icon: BookOpen, text: t('onboarding.ready.proLibrary', 'Personal library & collections') },
            { icon: Mail, text: t('onboarding.ready.proLetters', 'Letters to your future self') },
            { icon: MessageSquare, text: t('onboarding.ready.proCompanions', '{{count}} companion deep-dives / month', { count: PRICING.proCompanionUnlocks }) },
            { icon: Image, text: t('onboarding.ready.proWallpapers', '{{count}} AI wallpapers / month', { count: PRICING.proWallpapers }) },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon className="h-3 w-3 text-foreground/50 shrink-0" />
              <span className="text-xs text-foreground/80 leading-snug">{text}</span>
            </div>
          ))}
        </div>

        {/* Pro+ — compact upsell line, not a separate CTA. Pro+ is reachable
            from Settings post-signup; keeping it inline avoids decision
            paralysis on the trial page while still surfacing the option for
            power users. */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-foreground/60">
            {t('onboarding.ready.proPlusPlan', 'Pro+ · ${{price}}/mo', { price: PRICING.proPlusMonthlyPrice })}
          </p>
          <div className="flex items-start gap-2.5">
            <Zap className="h-3 w-3 text-foreground/50 shrink-0 mt-0.5" />
            <span className="text-xs text-foreground/70 leading-snug">
              {t(
                'onboarding.ready.proPlusSummary',
                'Everything in Pro, plus {{companions}} companion deep-dives & {{wallpapers}} AI wallpapers / month',
                {
                  companions: PRICING.proPlusCompanionUnlocks,
                  wallpapers: PRICING.proPlusWallpapers,
                },
              )}
            </span>
          </div>
        </div>

        {/* Flex packs — one-line top-up footnote. Purchasing happens from
            Settings; surfacing it here just sets the expectation that limits
            are not hard caps. */}
        <div className="flex items-start gap-2.5 pt-1">
          <Coins className="h-3 w-3 text-muted-foreground/40 shrink-0 mt-0.5" />
          <span className="text-[11px] text-muted-foreground/60 leading-snug">
            {t(
              'onboarding.ready.flexPacksHint',
              'Top up anytime · Flex S: {{sCredits}} credits / ${{sPrice}} · Flex M: {{mCredits}} credits / ${{mPrice}}',
              {
                sCredits: PRICING.flexPackSCredits,
                sPrice: PRICING.flexPackSPrice,
                mCredits: PRICING.flexPackMCredits,
                mPrice: PRICING.flexPackMPrice,
              },
            )}
          </span>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div className="space-y-3 pt-1" {...stagger(0.4)}>
        <LoadingButton
          onClick={onStartTrial}
          loading={checkoutLoading}
          loadingText={t('onboarding.ready.redirecting', 'Redirecting to checkout…')}
          className="w-full font-mono text-xs h-10 gap-2"
        >
          <Sparkles className="h-3 w-3" />
          {t('onboarding.ready.startTrial', 'Start {{days}}-day free trial', { days: PRICING.trialDays })}
        </LoadingButton>
        <p className="text-center text-[10px] font-mono text-muted-foreground/40 -mt-1">
          {t('onboarding.ready.trialFinePrint', 'Then ${{price}}/mo · Cancel anytime', { price: PRICING.monthlyPrice })}
        </p>
        <button
          onClick={onBeginFree}
          className="w-full text-center text-[10px] font-mono text-muted-foreground/40 hover:text-foreground transition-colors py-2"
        >
          {t('onboarding.ready.beginFree', 'Continue with free plan →')}
        </button>
      </motion.div>
    </div>
  );
}
