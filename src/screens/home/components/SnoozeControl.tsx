import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { SnoozePanel } from '@/screens/home/components/SnoozePanel';
import { useSnooze } from '@/features/user/public-hooks';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

/** Moon icon + modal panel for Home “Your pause” section header (Figma 475:27864). */
export function SnoozeToolbarControl() {
  "use memo";
  const { t } = useTranslation();
  const { isActive } = useSnooze();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          homeInWidget.iconBtn,
          isActive && 'text-nox-text-highlight hover:text-nox-text-highlight/80',
        )}
        aria-label={t('snooze.toolbarAria', { defaultValue: 'Silence automatic pauses' })}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Moon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'gap-0 rounded-lg border-2 border-border bg-card p-4',
            'w-[min(344px,calc(100vw-2rem))] max-w-[344px]',
            'max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain',
            '[&>button]:hidden',
          )}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SnoozePanel open={open} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** @deprecated Legacy full-width link — use {@link SnoozeToolbarControl} on Home. */
export function SnoozeControl() {
  return <SnoozeToolbarControl />;
}
