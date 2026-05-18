import { PauseDone } from '@/components/pause/PauseDone';
import {
  PauseSessionBriefRitualBody,
  type PauseSessionBriefRitualBodyProps,
} from '@/components/pause/PauseSessionBriefRitualBody';
import {
  PauseSessionDeepRitualBody,
  type PauseSessionDeepRitualBodyProps,
} from '@/components/pause/PauseSessionDeepRitualBody';
import type { PauseImpactData } from '@/features/pause/public';
import { type RitualDepth } from '@/features/pause/public';

export type PauseSessionScaffoldBodyProps = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefRitual: PauseSessionBriefRitualBodyProps;
  deepRitual: PauseSessionDeepRitualBodyProps;
  decision: string | null;
  onDoneReturn: () => void;
  pauseImpactData: PauseImpactData | null;
  /** Brief completion: navigate to Journey after outcome (session already cleared on decide). */
  onSaveToJourney?: () => void;
  /** Completed pause id — brief done screen logs `post_pause_emotion_logged`. */
  pauseInstanceIdForDone?: string | null;
};

/** Session / done content inside `PauseSessionScaffold` (brief vs deep vs completion). */
export function PauseSessionScaffoldBody({
  phase,
  ritualEntry,
  briefRitual,
  deepRitual,
  decision,
  onDoneReturn,
  pauseImpactData,
  onSaveToJourney,
  pauseInstanceIdForDone,
}: PauseSessionScaffoldBodyProps) {
  return (
    <>
      {phase === 'session' && ritualEntry === 'brief' && <PauseSessionBriefRitualBody {...briefRitual} />}
      {phase === 'session' && ritualEntry === 'deep' && <PauseSessionDeepRitualBody {...deepRitual} />}
      {phase === 'done' && (
        <PauseDone
          decision={decision}
          onReturn={onDoneReturn}
          pauseData={pauseImpactData}
          doneVariant={ritualEntry === 'brief' ? 'brief' : 'default'}
          onSaveToJourney={onSaveToJourney}
          pauseInstanceId={pauseInstanceIdForDone}
        />
      )}
    </>
  );
}
