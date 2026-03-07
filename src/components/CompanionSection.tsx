import { useState } from 'react';
import { BreathingExercise } from './BreathingExercise';
import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { ChevronDown } from 'lucide-react';

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

function CollapsibleCompanion({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
        {label}
      </button>
      {expanded && (
        <div className="animate-fade-in mt-2 ml-4.5">
          {children}
        </div>
      )}
    </div>
  );
}

export function CompanionSection({ companions, prefs, severity = 'mild' }: Props) {
  const [expandedBreathing, setExpandedBreathing] = useState(false);
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
        <CollapsibleCompanion
          label="Breathe with this"
          expanded={expandedBreathing}
          onToggle={() => setExpandedBreathing((v) => !v)}
        >
          <BreathingExercise severity={severity} />
        </CollapsibleCompanion>
      )}

      {hasHaiku && (
        <CollapsibleCompanion
          label="Read as haiku"
          expanded={expandedHaiku}
          onToggle={() => setExpandedHaiku((v) => !v)}
        >
          <HaikuDisplay haiku={companions.haiku!} />
        </CollapsibleCompanion>
      )}

      {hasLearning && (
        <CollapsibleCompanion
          label="Learn from history"
          expanded={expandedLearning}
          onToggle={() => setExpandedLearning((v) => !v)}
        >
          <LearningInput title={companions.learningTitle!} body={companions.learningBody!} />
        </CollapsibleCompanion>
      )}
    </div>
  );
}
