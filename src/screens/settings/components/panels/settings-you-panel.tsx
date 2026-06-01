import { Input } from '@/components/ui/input';
import { GroundingTagInput } from '@/screens/settings/components/GroundingTagInput';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsYouPanel() {
  const {
    t,
    firstName,
    setFirstName,
    motivations,
    setMotivations,
    mantra,
    setMantra,
    groundingActivities,
    setGroundingActivities,
  } = useSettingsState();
  return (
    <>
      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.firstName')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.firstNameDesc')}</p>
        <Input
          id="settings-first-name"
          name="given-name"
          autoComplete="given-name"
          value={firstName ?? ''}
          onChange={(e) => setFirstName(e.target.value || null)}
          placeholder={t('settings.firstNamePlaceholder')}
          maxLength={30}
          className="text-xs font-mono"
        />
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.myWhy')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.myWhyDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['freedom', 'family', 'generational', 'discipline', 'conviction', 'sovereignty', 'inflation', 'curiosity'] as const).map(
            (value) => {
              const selected = motivations.includes(value);
              return (
                <button type="button"
                  key={value}
                  onClick={() => {
                    const next = selected ? motivations.filter((v) => v !== value) : [...motivations, value];
                    setMotivations(next);
                  }}
                  className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? 'border-ring bg-muted/40 text-foreground'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <p className="font-medium text-sm font-sans text-secondary-foreground">{t(`settings.motivations.${value}`)}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm font-sans font-normal">
                    {t(`settings.motivations.${value}Desc`)}
                  </p>
                </button>
              );
            },
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.personalMantra')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.mantraDesc')}</p>
        <textarea
          value={mantra ?? ''}
          onChange={(e) => setMantra(e.target.value || null)}
          aria-label={t('settings.mantraPlaceholder')}
          placeholder={t('settings.mantraPlaceholder')}
          maxLength={200}
          rows={2}
          className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring transition-colors resize-none"
        />
        <p className="text-[10px] font-mono text-muted-foreground/50 text-right">{(mantra?.length ?? 0)}/200</p>
      </div>

      <GroundingTagInput activities={groundingActivities} onChange={setGroundingActivities} />
    </>
  );
}
