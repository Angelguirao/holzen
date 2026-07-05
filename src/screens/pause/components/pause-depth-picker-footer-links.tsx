import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type PauseDepthPickerFooterLinksProps = {
  onAboutPauses: () => void;
};

export function PauseDepthPickerFooterLinks({ onAboutPauses }: PauseDepthPickerFooterLinksProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="flex justify-center px-3 py-2">
      <Button
        type="button"
        variant="ghost"
        onClick={onAboutPauses}
        className="h-auto rounded-2xl px-3 py-2 text-sm font-medium tracking-[0.025em] text-nox-text-link hover:bg-nox-text-link/10 hover:text-nox-text-link"
      >
        {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
      </Button>
    </div>
  );
}
