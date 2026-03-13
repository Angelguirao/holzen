import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Anchor, X } from 'lucide-react';
import { useState, useCallback } from 'react';

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  stagger: (delay: number) => object;
}

export function OnboardingGrounding({ selected, onToggle, stagger }: Props) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
        e.preventDefault();
        const tag = inputValue.trim().toLowerCase();
        if (!selected.includes(tag)) {
          onToggle(tag);
        }
        setInputValue('');
      }
      if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
        onToggle(selected[selected.length - 1]);
      }
    },
    [inputValue, selected, onToggle]
  );

  return (
    <div className="space-y-6">
      <motion.div className="space-y-2" {...stagger(0.1)}>
        <p className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
          {t('onboarding.yourGrounding')}
        </p>
        <div className="h-px w-8 bg-foreground/20" />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed"
        {...stagger(0.15)}
      >
        {t('onboarding.groundingIntro')}
      </motion.p>

      <motion.div className="space-y-3" {...stagger(0.25)}>
        <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full border border-foreground/20 bg-foreground/5 text-foreground/80"
            >
              {tag}
              <button
                onClick={() => onToggle(tag)}
                className="text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('onboarding.groundingPlaceholder', 'e.g. running, cooking, guitar...')}
          className="w-full bg-transparent border-b border-border/40 focus:border-foreground/30 outline-none text-sm font-mono py-2 text-foreground placeholder:text-muted-foreground/30 transition-colors"
        />
      </motion.div>

      <motion.p className="text-[10px] text-muted-foreground/40 flex items-center gap-1.5" {...stagger(0.4)}>
        <Anchor className="h-2.5 w-2.5" />
        {t('onboarding.groundingHint')}
      </motion.p>
    </div>
  );
}
