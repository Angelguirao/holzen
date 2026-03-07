import { useState, useCallback } from 'react';
import { BreathingExercise } from './BreathingExercise';
import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface CompletionState {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
}

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  reflectionId?: string | null;
  context?: string | null;
}

function CollapsibleCompanion({
  label,
  expanded,
  onToggle,
  completed,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  completed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {completed ? (
          <Check className="h-3 w-3 shrink-0 text-primary" />
        ) : (
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
        )}
        <span className={completed ? 'text-muted-foreground/50' : ''}>{label}</span>
      </button>
      {expanded && (
        <div className="animate-fade-in mt-2 ml-4.5">
          {children}
        </div>
      )}
    </div>
  );
}

export function CompanionSection({ companions, prefs, severity = 'mild', reflectionId, context }: Props) {
  const [expandedBreathing, setExpandedBreathing] = useState(false);
  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);
  const [completion, setCompletion] = useState<CompletionState>({
    breathing: false,
    haiku: false,
    learning: false,
  });

  const markCompleted = useCallback(async (key: keyof CompletionState) => {
    if (completion[key]) return;
    setCompletion((prev) => ({ ...prev, [key]: true }));
    if (reflectionId) {
      const dbKey = key === 'breathing' ? 'breathing_completed' : key === 'haiku' ? 'haiku_read' : 'learning_read';
      await supabase
        .from('reflections')
        .update({ [dbKey]: true } as any)
        .eq('id', reflectionId);
    }
  }, [reflectionId, completion]);

  const hasBreathing = prefs.breathing;
  const hasHaiku = prefs.haiku && companions.haiku;
  const hasLearning = prefs.learning; // Ground nudges always available

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
          completed={completion.breathing}
        >
          <BreathingExercise severity={severity} onComplete={() => markCompleted('breathing')} onClose={() => setExpandedBreathing(false)} autoOpen />
        </CollapsibleCompanion>
      )}

      {hasHaiku && (
        <CollapsibleCompanion
          label="Read as haiku"
          expanded={expandedHaiku}
          onToggle={() => {
            setExpandedHaiku((v) => !v);
            if (!completion.haiku) markCompleted('haiku');
          }}
          completed={completion.haiku}
        >
          <HaikuDisplay haiku={companions.haiku!} />
        </CollapsibleCompanion>
      )}

      {hasLearning && (
        <CollapsibleCompanion
          label="Ground yourself"
          expanded={expandedLearning}
          onToggle={() => {
            setExpandedLearning((v) => !v);
            if (!completion.learning) markCompleted('learning');
          }}
          completed={completion.learning}
        >
          <LearningInput
            title={companions.learningTitle ?? ''}
            body={companions.learningBody ?? ''}
            context={context}
            reflectionId={reflectionId}
            useGroundNudge
          />
        </CollapsibleCompanion>
      )}
    </div>
  );
}
