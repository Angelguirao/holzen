import { motion } from 'framer-motion';
import { hapticFeedback } from '@/lib/haptics';
import { pauseStepLayout } from '@/features/pause/public-session';
import { PauseDecideChoices } from '@/screens/pause/components/pause-decide-choices';
import { PauseRitualBackRow } from '@/screens/pause/components/pause-ritual-back-row';

interface Props {
  onDecide: (decision: string) => void;
  /** Return to the prior macro step (second Breathe). */
  onBack?: () => void;
  /** Optional kicker above the title (e.g. archive retrospective). Ritual flows omit — stepper carries context. */
  introKicker?: string;
  /** When true, the choices-screen footer Back row is omitted (stepper-only nav in `/pause`). */
  hideChoicesBack?: boolean;
}

export function PauseDecide({ onDecide, onBack, introKicker, hideChoicesBack }: Props) {
  "use memo";

  const introLine = introKicker != null && introKicker.trim() !== '' ? introKicker : null;

  const handleDecision = (decision: 'held' | 'bought' | 'sold') => {
    hapticFeedback('medium');
    onDecide(decision);
  };

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <PauseDecideChoices
        introLine={introLine}
        onHold={() => handleDecision('held')}
        onBought={() => handleDecision('bought')}
        onSold={() => handleDecision('sold')}
      />

      {!hideChoicesBack ? <PauseRitualBackRow onBack={onBack} /> : null}
    </motion.div>
  );
}
