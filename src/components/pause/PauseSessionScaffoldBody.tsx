import { PauseDone } from '@/components/pause/PauseDone';
import {
  PauseSessionBriefRitualBody,
  type PauseSessionBriefRitualBodyProps,
} from '@/components/pause/PauseSessionBriefRitualBody';
import {
  PauseSessionDeepRitualBody,
  type PauseSessionDeepRitualBodyProps,
} from '@/components/pause/PauseSessionDeepRitualBody';
import type { PauseImpactData } from '@/lib/pause-impact-data';
import type { RitualDepth } from '@/lib/pause-session-storage';

export type PauseSessionScaffoldBodyProps = {
  phase: 'session' | 'done';
  ritualEntry: RitualDepth | 'picker';
  briefRitual: PauseSessionBriefRitualBodyProps;
  deepRitual: PauseSessionDeepRitualBodyProps;
  decision: string | null;
  onDoneReturn: () => void;
  pauseImpactData: PauseImpactData | null;
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
}: PauseSessionScaffoldBodyProps) {
  return (
    <>
      {phase === 'session' && ritualEntry === 'brief' && <PauseSessionBriefRitualBody {...briefRitual} />}
      {phase === 'session' && ritualEntry === 'deep' && <PauseSessionDeepRitualBody {...deepRitual} />}
      {phase === 'done' && (
        <PauseDone decision={decision} onReturn={onDoneReturn} pauseData={pauseImpactData} />
      )}
    </>
  );
}
