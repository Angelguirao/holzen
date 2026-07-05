import { useState } from 'react';
import { ProLock } from '@/components/ui/pro-lock';
import { useTranslation } from 'react-i18next';

/** Pause tone, style, and custom prompt — legacy UI only (not persisted after schema cleanup). */
export function SettingsPauseReflectionLegacySection() {
  const { t } = useTranslation();
  const [reflectionTone, setReflectionTone] = useState('stoic');
  const [reflectionStyle, setReflectionStyle] = useState('standard');
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);

  return (
    <>
      <ProLock feature="tone">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.tone')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.toneDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['stoic', 'zen', 'poetic', 'blunt'] as const).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setReflectionTone(value)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  reflectionTone === value
                    ? 'border-ring bg-muted/40 text-foreground'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <p className="text-xs font-mono font-medium">{t(`settings.tones.${value}`)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(`settings.tones.${value}Desc`)}</p>
              </button>
            ))}
          </div>
        </div>
      </ProLock>

      <ProLock feature="style">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.style')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.styleDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'standard', key: 'standard' },
                { value: 'one-liner', key: 'oneLiner' },
                { value: 'question', key: 'question' },
                { value: 'metaphor', key: 'metaphor' },
                { value: 'koan', key: 'koan' },
              ] as const
            ).map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setReflectionStyle(s.value)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  reflectionStyle === s.value
                    ? 'border-ring bg-muted/40 text-foreground'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <p className="text-xs font-mono font-medium">{t(`settings.styles.${s.key}`)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(`settings.styles.${s.key}Desc`)}</p>
              </button>
            ))}
          </div>
        </div>
      </ProLock>

      <ProLock feature="custom_prompt">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.customPrompt')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.customPromptDesc')}</p>
          <textarea
            value={customPrompt ?? ''}
            onChange={(e) => setCustomPrompt(e.target.value || null)}
            aria-label={t('settings.customPromptPlaceholder')}
            placeholder={t('settings.customPromptPlaceholder')}
            maxLength={200}
            rows={3}
            className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring transition-colors resize-none"
          />
          <p className="text-[10px] font-mono text-muted-foreground/50 text-right">{(customPrompt?.length ?? 0)}/200</p>
        </div>
      </ProLock>
    </>
  );
}
