import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const MOTIVATIONS = [
  'freedom',
  'family',
  'generational',
  'discipline',
  'conviction',
  'sovereignty',
  'inflation',
  'curiosity',
] as const;

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  stagger: (delay: number) => object;
}

export function OnboardingWhy({ selected, onToggle, stagger }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.yourWhy')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.whyIntro')}
      </motion.p>

      <motion.div className="grid grid-cols-2 gap-2" {...stagger(0.25)}>
        {MOTIVATIONS.map((id) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`text-left px-3 py-2.5 rounded-sm border transition-all duration-200 ${
                isSelected
                  ? 'border-foreground/30 bg-foreground/5'
                  : 'border-border/40 hover:border-border/80 bg-transparent'
              }`}
            >
              <p className={`text-xs font-mono transition-colors ${isSelected ? 'text-foreground' : 'text-foreground/70'}`}>
                {t(`settings.motivations.${id}`)}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                {t(`settings.motivations.${id}Desc`)}
              </p>
            </button>
          );
        })}
      </motion.div>

      <motion.p className="text-[10px] text-muted-foreground/40 flex items-center gap-1.5" {...stagger(0.4)}>
        <Heart className="h-2.5 w-2.5" />
        {t('onboarding.whyHint')}
      </motion.p>
    </div>
  );
}
