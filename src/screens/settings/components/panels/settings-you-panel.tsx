import { Input } from '@/components/ui/input';
import { ANCHOR_MANTRA_MAX_LENGTH } from '@/features/user/domain/profile-motivations';
import { MotivationPickerGrid } from '@/features/user/presentation/MotivationPickerGrid';
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
        <MotivationPickerGrid
          selected={motivations}
          onChange={setMotivations}
          lockLastSelected
        />
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.personalMantra')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.mantraDesc')}</p>
        <textarea
          value={mantra ?? ''}
          onChange={(e) => setMantra(e.target.value.slice(0, ANCHOR_MANTRA_MAX_LENGTH) || null)}
          aria-label={t('settings.mantraPlaceholder')}
          placeholder={t('settings.mantraPlaceholder')}
          maxLength={ANCHOR_MANTRA_MAX_LENGTH}
          rows={2}
          className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring transition-colors resize-none"
        />
        <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
          {(mantra?.length ?? 0)}/{ANCHOR_MANTRA_MAX_LENGTH}
        </p>
      </div>

      <GroundingTagInput activities={groundingActivities} onChange={setGroundingActivities} />
    </>
  );
}
