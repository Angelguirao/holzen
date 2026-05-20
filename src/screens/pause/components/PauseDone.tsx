import { PauseDoneBrief } from '@/screens/pause/components/pause-done-brief';
import { PauseDoneDefault } from '@/screens/pause/components/pause-done-default';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';

export type { PauseDonePauseData };

interface Props {
  decision: string | null;
  onReturn: () => void;
  pauseData?: PauseDonePauseData | null;
  /** Brief ritual completion: journey CTA + optional check-in block. */
  doneVariant?: 'default' | 'brief';
  /** Brief only: runs after optional mood RPC; clears session and navigates to Journey. */
  onSaveToJourney?: () => void;
  /** When set, brief Save to journey can persist post-completion mood via `post_pause_emotion_logged`. */
  pauseInstanceId?: string | null;
}

export function PauseDone({
  decision,
  onReturn,
  pauseData,
  doneVariant = 'default',
  onSaveToJourney,
  pauseInstanceId,
}: Props) {
  const { subscribed } = useSubscription();

  if (doneVariant === 'brief') {
    return (
      <PauseDoneBrief
        decision={decision}
        pauseData={pauseData}
        pauseInstanceId={pauseInstanceId}
        onSaveToJourney={onSaveToJourney}
      />
    );
  }

  return (
    <PauseDoneDefault
      decision={decision}
      onReturn={onReturn}
      pauseData={pauseData}
      pauseInstanceId={pauseInstanceId}
    />
  );
}
