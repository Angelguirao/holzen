import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MarketQuote } from '@/features/market/public';
import { PauseAboutPausesBody } from '@/screens/pause/components/PauseAboutPausesBody';
import { PauseDepthPicker } from '@/screens/pause/components/PauseDepthPicker';
import { PauseScienceScrollBody } from '@/screens/pause/components/PauseScienceSheet';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Depth choice on `/pause` before a ritual starts; About + Step science live here only. */
export function PauseSessionDepthPickerStack(props: {
  marketData: MarketQuote | null;
  trackedAssetId: string;
  contextText?: string | null;
  onBrief: () => void;
  onDeep: () => void;
  /** Free users: deep card shows a Pro / trial hint; `onDeep` should still run (e.g. paywall). */
  deepPauseLocked?: boolean;
  /** Manual open from Home idle — instance still creating. */
  choicesDisabled?: boolean;
  onClose: () => void;
}) {
  "use memo";
  const { t } = useTranslation();
  const {
    marketData,
    trackedAssetId,
    contextText = null,
    onBrief,
    onDeep,
    deepPauseLocked = false,
    choicesDisabled = false,
    onClose,
  } = props;

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState<'about' | 'steps'>('about');

  const openAbout = () => {
    setHelpTab('about');
    setHelpOpen(true);
  };

  return (
    <>
      <PauseDepthPicker
        marketData={marketData}
        trackedAssetId={trackedAssetId}
        contextText={contextText}
        onBrief={onBrief}
        onDeep={onDeep}
        deepPauseLocked={deepPauseLocked}
        choicesDisabled={choicesDisabled}
        onAboutPauses={openAbout}
        onClose={onClose}
      />
      <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
        <SheetContent
          side="bottom"
          className="z-[120] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8"
        >
          <SheetTitle className="sr-only">{t('pause.scienceSheet.sheetTitle')}</SheetTitle>
          <Tabs value={helpTab} onValueChange={(v) => setHelpTab(v === 'steps' ? 'steps' : 'about')} className="w-full">
            <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1 sm:mb-6">
              <TabsTrigger value="about" className="text-xs sm:text-sm">
                {t('pause.scienceSheet.tabAbout')}
              </TabsTrigger>
              <TabsTrigger value="steps" className="text-xs sm:text-sm">
                {t('pause.scienceSheet.tabSteps')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="mt-0 focus-visible:outline-none">
              <PauseAboutPausesBody />
            </TabsContent>
            <TabsContent value="steps" className="mt-0 focus-visible:outline-none">
              <PauseScienceScrollBody currentStep="feel" />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </>
  );
}
