import { Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type PauseDepthPickerHeaderProps = {
  onAboutPauses: () => void;
  onClose: () => void;
};

export function PauseDepthPickerHeader({ onAboutPauses, onClose }: PauseDepthPickerHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm">
      <div className="relative mx-auto flex h-12 max-w-lg items-center justify-end gap-2.5 px-4 sm:px-8">
        <p className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium leading-5 tracking-[0.01em] text-foreground">
          {t('pause.depthPicker.kicker', { defaultValue: 'What do you need?' })}
        </p>
        <div className="relative z-10 flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onAboutPauses}
            aria-label={t('pause.aboutPauses.openAria')}
          >
            <Info className="h-6 w-6 text-muted-foreground" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-6 w-6 text-muted-foreground" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  );
}
