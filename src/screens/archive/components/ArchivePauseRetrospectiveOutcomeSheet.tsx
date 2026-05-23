import { useTranslation } from 'react-i18next';
import { PauseDecide } from '@/screens/pause/components/PauseDecide';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/public';
import {
  useArchivePauseRetrospectiveOutcome,
  type PauseArchiveRow,
} from '@/features/pause/public-hooks';

type Props = {
  row: PauseArchiveRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void | Promise<void>;
};

export function ArchivePauseRetrospectiveOutcomeSheet({ row, open, onOpenChange, onSuccess }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const id = row.id;

  const { submitting, handleDecide } = useArchivePauseRetrospectiveOutcome({
    instanceId: id,
    userId: user?.id,
    onOpenChange,
    onSuccess,
    t,
  });

  if (!id) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">
            {t('archive.retrospectiveSheetTitle', { defaultValue: 'Log your decision' })}
          </SheetTitle>
          <SheetDescription className="text-left text-sm leading-relaxed">
            {t('archive.retrospectiveSheetBody', {
              defaultValue:
                'This pause ended (expired or dismissed) before you finished Decide on the ritual screen. Your answer is saved for patterns and stats; the row stays expired or dismissed.',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className={cn('mt-4 space-y-6 pb-6', submitting && 'pointer-events-none opacity-60')}>
          <PauseDecide
            onDecide={handleDecide}
            introKicker={t('archive.retrospectiveDecideKicker', { defaultValue: 'Archive' })}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
