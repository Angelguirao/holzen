import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';

interface Props {
  mantra: string;
  onMantraChange: (value: string) => void;
  onHoldGoalPresenceChange: (hasGoal: boolean) => void;
  stagger: (delay: number) => object;
}

export function OnboardingCommitment({
  mantra,
  onMantraChange,
  onHoldGoalPresenceChange,
  stagger,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="max-h-[min(520px,72vh)] space-y-5 overflow-y-auto overflow-x-hidden pr-1">
      <motion.div className="space-y-2" {...stagger(0.08)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.commitmentKicker', { defaultValue: 'Your commitment' })}
        </p>
        <h2 className="text-lg font-medium leading-snug text-foreground">
          {t('onboarding.commitmentTitle', { defaultValue: 'Hold goal & mantra' })}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('onboarding.commitmentIntro')}
        </p>
      </motion.div>

      <motion.div className="space-y-2" {...stagger(0.14)}>
        <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/60">
          {t('onboarding.commitmentHoldLabel', { defaultValue: 'Hold goal' })}
        </p>
        <HoldGoalWidget onHoldGoalPresenceChange={onHoldGoalPresenceChange} />
      </motion.div>

      <motion.div className="space-y-2" {...stagger(0.22)}>
        <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/60">
          {t('settings.personalMantra')}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{t('onboarding.commitmentMantraHint')}</p>
        <textarea
          value={mantra}
          onChange={(e) => onMantraChange(e.target.value)}
          placeholder={t('settings.mantraPlaceholder')}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
        />
        <p className="text-right text-[10px] font-mono text-muted-foreground/50">{mantra.length}/200</p>
      </motion.div>

      <motion.p className="text-[10px] font-mono leading-relaxed text-muted-foreground/60" {...stagger(0.28)}>
        {t('onboarding.commitmentFooterHint')}
      </motion.p>
    </div>
  );
}
