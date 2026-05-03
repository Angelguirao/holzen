import { PauseAboutPausesBody } from '@/components/pause/PauseAboutPausesBody';
import { PauseDepthPicker } from '@/components/pause/PauseDepthPicker';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

/** Depth choice + “About pauses” sheet on `/pause` before a ritual starts. */
export function PauseSessionDepthPickerStack(props: {
  contextLine: string | null;
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
  onClose: () => void;
  aboutSheetOpen: boolean;
  onAboutSheetOpenChange: (open: boolean) => void;
  aboutSheetTitle: string;
}) {
  const {
    contextLine,
    onBrief,
    onDeep,
    onAboutPauses,
    onClose,
    aboutSheetOpen,
    onAboutSheetOpenChange,
    aboutSheetTitle,
  } = props;

  return (
    <>
      <PauseDepthPicker
        contextLine={contextLine}
        onBrief={onBrief}
        onDeep={onDeep}
        onAboutPauses={onAboutPauses}
        onClose={onClose}
      />
      <Sheet open={aboutSheetOpen} onOpenChange={onAboutSheetOpenChange}>
        <SheetContent
          side="bottom"
          className="z-[120] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8"
        >
          <SheetTitle className="sr-only">{aboutSheetTitle}</SheetTitle>
          <PauseAboutPausesBody />
        </SheetContent>
      </Sheet>
    </>
  );
}
