import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ShareReflection } from './ShareReflection';
import { ReflectionNote } from './ReflectionNote';
import { ReflectionTags } from './ReflectionTags';
import { CompanionSection, type CompanionData, type CompanionPrefs } from './CompanionSection';

interface Props {
  message: string;
  context: string | null;
  onDismiss: () => void;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  reflectionId?: string | null;
}

export const ReflectionMessage = forwardRef<HTMLDivElement, Props>(function ReflectionMessage({ message, context, onDismiss, companions, companionPrefs, severity, reflectionId }, ref) {
  return (
    <div ref={ref} className="space-y-6">
      {context && (
        <p className="text-xs font-mono text-muted-foreground">{context}</p>
      )}
      <p className="text-lg leading-relaxed">{message}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <ShareReflection message={message} context={context} haiku={companions?.haiku} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs font-mono text-muted-foreground"
        >
          I've sat with this
        </Button>
      </div>

      {reflectionId && <ReflectionNote reflectionId={reflectionId} initialNote={null} />}
      {reflectionId && <ReflectionTags reflectionId={reflectionId} initialTags={[]} />}

      {companions && companionPrefs && (
        <CompanionSection
          companions={companions}
          prefs={companionPrefs}
          severity={severity}
          reflectionId={reflectionId}
        />
      )}
    </div>
  );
});
