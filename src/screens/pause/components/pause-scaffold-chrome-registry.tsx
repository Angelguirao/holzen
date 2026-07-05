import { PauseBriefProgress } from '@/screens/pause/components/PauseBriefProgress';
import { PauseEngagedOpenMaxCountdown } from '@/screens/pause/components/PauseEngagedOpenMaxCountdown';
import type { PauseScaffoldChromeRegistry } from '@/features/pause/public-session-ritual';

/** `/pause` scaffold header slot renderers — wired into `usePauseSessionScreen`. */
export const pauseSessionScaffoldChromeRegistry: PauseScaffoldChromeRegistry = {
  renderBriefStepper: (briefStep) => <PauseBriefProgress currentStep={briefStep} />,
  renderEngagedOpenMaxCountdown: (anchorIso) => (
    <PauseEngagedOpenMaxCountdown anchorIso={anchorIso} />
  ),
};
