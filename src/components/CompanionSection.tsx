import { useState } from 'react';
import { BreathingExercise } from './BreathingExercise';
import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';

export interface CompanionData {
  haiku: string | null;
  learningTitle: string | null;
  learningBody: string | null;
}

export interface CompanionPrefs {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
}

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
}

export function CompanionSection({ companions, prefs, severity = 'mild' }: Props) {
  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);

  const hasBreathing = prefs.breathing;
  const hasHaiku = prefs.haiku && companions.haiku;
  const hasLearning = prefs.learning && companions.learningTitle && companions.learningBody;

  if (!hasBreathing && !hasHaiku && !hasLearning) return null;

  return (
    <div className="space-y-3 pt-2 border-t border-border/40">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        Pause with this
      </p>

      {hasBreathing && (
        <BreathingExercise severity={severity} />
      )}

      {hasHaiku && (
        <div>
          {expandedHaiku ? (
            <HaikuDisplay haiku={companions.haiku!} />
          ) : (
            <button
              onClick={() => setExpandedHaiku(true)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Read as haiku →
            </button>
          )}
        </div>
      )}

      {hasLearning && (
        <div>
          {expandedLearning ? (
            <LearningInput title={companions.learningTitle!} body={companions.learningBody!} />
          ) : (
            <button
              onClick={() => setExpandedLearning(true)}
              className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Learn from history →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
