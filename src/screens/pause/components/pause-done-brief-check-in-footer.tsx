import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type PauseDoneBriefCheckInFooterProps = {
  showNoSnapshotHint: boolean;
  showSaveButton: boolean;
  saveBusy: boolean;
  onSave: () => void | Promise<void>;
};

/** Brief Done check-in: optional snapshot hint and Save to Journey CTA. */
export function PauseDoneBriefCheckInFooter({
  showNoSnapshotHint,
  showSaveButton,
  saveBusy,
  onSave,
}: PauseDoneBriefCheckInFooterProps) {
  const { t } = useTranslation();

  return (
    <>
      {showNoSnapshotHint ? (
        <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
          {t('pause.brief.done.contributionWhenNoSnapshot', {
            defaultValue: 'Save to Journey to see this pause in your stats.',
          })}
        </p>
      ) : null}

      {showSaveButton ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            disabled={saveBusy}
            className={cn(
              'rounded-full border-primary bg-primary/5 px-6 py-2.5 text-sm font-medium text-primary shadow-sm hover:bg-primary/10',
              saveBusy && 'opacity-70',
            )}
            onClick={() => void onSave()}
          >
            {saveBusy
              ? t('pause.brief.done.saveToJourneySaving', { defaultValue: 'Saving…' })
              : t('pause.brief.done.saveToJourney')}
          </Button>
        </div>
      ) : null}
    </>
  );
}
