import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Anchor, Plus, X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

interface Props {
  selected: string[];
  onToggle: (id: string) => void;
  stagger: (delay: number) => object;
}

const SUGGESTIONS = [
  'running', 'walking', 'cooking', 'guitar', 'meditation',
  'gardening', 'reading', 'drawing', 'yoga', 'swimming',
  'cycling', 'journaling', 'stretching', 'cleaning', 'breathing',
];

export function OnboardingGrounding({ selected, onToggle, stagger }: Props) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !selected.includes(tag)) {
      onToggle(tag);
    }
    setInputValue('');
  }, [inputValue, selected, onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
        e.preventDefault();
        addTag();
      }
      if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
        onToggle(selected[selected.length - 1]);
      }
    },
    [inputValue, selected, onToggle, addTag]
  );

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addTag();
    }
  }, [inputValue, addTag]);

  // Filter suggestions to exclude already-selected ones
  const availableSuggestions = SUGGESTIONS.filter(s => !selected.includes(s));

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
        {/* Selected tags */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
        )}

        {/* Input with add button */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={selected.length === 0
              ? t('onboarding.groundingPlaceholder', { defaultValue: 'e.g. running, cooking, guitar...' })
              : t('onboarding.groundingAddMore', { defaultValue: 'Add another...' })
            }
            className="flex-1 bg-transparent border-b border-border/40 focus:border-foreground/30 outline-none text-sm font-mono py-2 text-foreground placeholder:text-muted-foreground/30 transition-colors"
          />
          {inputValue.trim() && (
            <button
              onMouseDown={(e) => e.preventDefault()} // prevent blur before click
              onClick={addTag}
              className="shrink-0 p-1.5 rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Quick suggestions */}
        {selected.length < 3 && availableSuggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-mono text-muted-foreground/30 tracking-[0.15em] uppercase">
              {t('onboarding.groundingSuggestions', { defaultValue: 'Suggestions' })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestions.slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onToggle(suggestion)}
                  className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-border/20 bg-muted/10 text-muted-foreground/40 hover:border-foreground/20 hover:text-foreground/60 transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.p className="text-[10px] text-muted-foreground/40 flex items-center gap-1.5" {...stagger(0.4)}>
        <Anchor className="h-2.5 w-2.5" />
        {t('onboarding.groundingHint')}
      </motion.p>
    </div>
  );
}
