import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type PauseDepthPickerFooterLinksProps = {
  onAboutPauses: () => void;
  onOpenStepScience: () => void;
};

export function PauseDepthPickerFooterLinks({
  onAboutPauses,
  onOpenStepScience,
}: PauseDepthPickerFooterLinksProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-8">
      <Button
        type="button"
        variant="ghost"
        onClick={onAboutPauses}
        className="h-auto rounded-2xl px-3 py-2 text-xs font-medium tracking-[0.05em] text-nox-text-link hover:bg-nox-text-link/10 hover:text-nox-text-link"
      >
        {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onOpenStepScience}
        className="h-auto rounded-2xl px-3 py-2 text-xs font-medium tracking-[0.05em] text-muted-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:bg-muted/40 hover:text-foreground"
      >
        {t('pause.scienceSheet.tabSteps')}
      </Button>
    </div>
  );
}
