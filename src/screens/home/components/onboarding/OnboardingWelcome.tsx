import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

interface Props {
  firstName: string;
  onFirstNameChange: (v: string) => void;
  timezone: string;
  stagger: (delay: number) => object;
}

/** @deprecated Not used by the onboarding flow in `Onboarding.tsx`; retained for reference or future reuse. */
export function OnboardingWelcome({ firstName, onFirstNameChange, timezone, stagger }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('common.holzen')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-xl leading-relaxed text-foreground"
        {...stagger(0.2)}
      >
        {t('onboarding.heroText')}
      </motion.p>

      <motion.div className="space-y-4" {...stagger(0.3)}>
        <div className="space-y-2">
          <Label htmlFor="onboarding-first-name" className="text-xs font-mono text-muted-foreground">
            {t('onboarding.whatToCallYou')}
          </Label>
          <Input
            id="onboarding-first-name"
            name="given-name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder={t('onboarding.firstNameOptional')}
            maxLength={30}
            className="text-xs font-mono bg-transparent border-border/40 focus:border-foreground/30"
            autoFocus
          />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground/40">
          {t('onboarding.timezone', { tz: timezone.replace(/_/g, ' ') })}
        </p>
      </motion.div>
    </div>
  );
}
