import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '@/lib/haptics';
import { pauseStepLayout } from '@/features/pause/public-hooks';
import { PauseDecideChoices } from '@/screens/pause/components/pause-decide-choices';
import { PauseDecideMirror } from '@/screens/pause/components/pause-decide-mirror';
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
  const [mirrorDecision, setMirrorDecision] = useState<string | null>(null);

  const introLine = introKicker != null && introKicker.trim() !== '' ? introKicker : null;

  const handleHold = () => {
    hapticFeedback('medium');
    onDecide('held');
  };

  const handleAction = (value: 'sold' | 'bought') => {
    hapticFeedback('medium');
    setMirrorDecision(value);
  };

  const confirmMirror = () => {
    if (mirrorDecision) {
      hapticFeedback('medium');
      onDecide(mirrorDecision);
    }
  };

  const cancelMirror = () => {
    hapticFeedback('light');
    setMirrorDecision(null);
  };

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!mirrorDecision ? (
          <PauseDecideChoices
            introLine={introLine}
            onHold={handleHold}
            onBought={() => handleAction('bought')}
            onSold={() => handleAction('sold')}
          />
        ) : (
          <PauseDecideMirror
            mirrorDecision={mirrorDecision as 'sold' | 'bought'}
            onConfirm={confirmMirror}
            onCancel={cancelMirror}
            onBack={onBack}
          />
        )}
      </AnimatePresence>

      {!mirrorDecision && !hideChoicesBack ? <PauseRitualBackRow onBack={onBack} /> : null}
    </motion.div>
  );
}
