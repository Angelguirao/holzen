import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

export function GroundingTagInput({
  activities,
  onChange,
}: {
  activities: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      const tag = inputValue.trim().toLowerCase();
      if (!activities.includes(tag)) {
        onChange([...activities, tag]);
      }
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && activities.length > 0) {
      onChange(activities.slice(0, -1));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.groundingTitle')}</p>
      <p className="leading-relaxed text-primary text-sm">
        {t('settings.groundingDesc')}
      </p>
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {activities.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-foreground/80"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(activities.filter((a) => a !== tag))}
              className="hover:text-foreground transition-colors"
              style={{ color: '#7B8A9E' }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('onboarding.groundingPlaceholder', { defaultValue: 'e.g. running, cooking, guitar...' })}
        className="w-full bg-transparent border-b border-border/40 focus:border-foreground/30 outline-none text-sm font-mono py-2 text-foreground placeholder:text-muted-foreground/30 transition-colors"
      />
    </div>
  );
}
