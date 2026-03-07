import { selectGroundNudge } from '@/lib/ground-nudges';

interface Props {
  title: string;
  body: string;
  context?: string | null;
  useGroundNudge?: boolean;
}

export function LearningInput({ title, body, context, useGroundNudge = true }: Props) {
  // If ground nudge mode is active, override with curated content
  const nudge = useGroundNudge ? selectGroundNudge(context) : null;
  const displayTitle = nudge ? nudge.title : title;
  const displayBody = nudge ? nudge.body : body;

  return (
    <div className="py-3 space-y-1.5">
      <p className="text-xs font-mono font-medium text-foreground/80">{displayTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{displayBody}</p>
      {nudge && (
        <p className="text-[9px] font-mono text-muted-foreground/30 pt-1">
          Behavioral science · Research-grounded
        </p>
      )}
    </div>
  );
}
