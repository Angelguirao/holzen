import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { PauseAboutPausesBody } from '@/screens/pause/components/PauseAboutPausesBody';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Figma Wireframes 330:25564+ — “About pauses” bottom sheet from depth picker info / link. */
export function PauseAboutPausesSheet({ open, onOpenChange }: Props) {
  "use memo";
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[120] flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-t-3xl border-0 bg-muted p-0 sm:mx-auto sm:max-w-lg [&>button.absolute]:hidden"
      >
        <SheetTitle className="sr-only">
          {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
        </SheetTitle>

        <div className="relative shrink-0 px-8 pb-2 pt-9">
          <p className="text-center text-sm font-medium leading-5 tracking-[0.01em] text-foreground">
            {t('pause.aboutPauses.link', { defaultValue: 'About pauses' })}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-6 top-8 h-6 w-6 shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label={t('common.close', { defaultValue: 'Close' })}
          >
            <X className="h-6 w-6 text-muted-foreground" aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-10">
          <PauseAboutPausesBody />
        </div>
      </SheetContent>
    </Sheet>
  );
}
