import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type HomePauseHelpFeedbackSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onSubmit: (rating: number, comment: string) => void | Promise<void>;
  onDefer: () => void;
};

/** Figma 581 / 582 — post-pause satisfaction bottom sheet on Home. */
export function HomePauseHelpFeedbackSheet({
  open,
  onOpenChange,
  submitting,
  onSubmit,
  onDefer,
}: HomePauseHelpFeedbackSheetProps) {
  "use memo";
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const resetForm = () => {
    setRating(0);
    setComment('');
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] border-t px-6 pb-8 pt-10 sm:max-w-md sm:mx-auto"
      >
        <SheetHeader className="space-y-3 px-0 text-center sm:text-center">
          <SheetTitle className="text-base font-medium leading-6 text-foreground">
            {t('home.pauseHelpFeedback.title')}
          </SheetTitle>
          <p className="text-sm font-normal leading-5 text-muted-foreground">
            {t('home.pauseHelpFeedback.subtitle')}
          </p>
        </SheetHeader>

        <div className="mt-6 flex justify-center gap-2" role="group" aria-label={t('home.pauseHelpFeedback.ratingLabel')}>
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = value <= rating;
            return (
              <button
                key={value}
                type="button"
                aria-label={t('home.pauseHelpFeedback.starAria', { value })}
                aria-pressed={selected}
                className="rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setRating(value)}
              >
                <Star
                  className={cn(
                    'h-8 w-8',
                    selected ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="pause-help-feedback-comment" className="text-sm font-medium text-foreground">
            {t('home.pauseHelpFeedback.commentLabel')}
          </label>
          <Textarea
            id="pause-help-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('home.pauseHelpFeedback.commentPlaceholder')}
            className="min-h-[88px] resize-none text-sm"
            maxLength={500}
          />
        </div>

        <div className="mt-6 space-y-3">
          <LoadingButton
            type="button"
            className="w-full"
            loading={submitting}
            disabled={rating < 1}
            onClick={() => void onSubmit(rating, comment)}
          >
            {t('home.pauseHelpFeedback.send')}
          </LoadingButton>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onDefer}>
            {t('home.pauseHelpFeedback.maybeLater')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
