import { Button } from '@/components/ui/button';
import { ShareReflection } from './ShareReflection';
import { CompanionSection, type CompanionData, type CompanionPrefs } from './CompanionSection';

interface Props {
  message: string;
  context: string | null;
  onDismiss: () => void;
  companions?: CompanionData;
  companionPrefs?: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
}

export function ReflectionMessage({ message, context, onDismiss, companions, companionPrefs, severity }: Props) {
  return (
    <div className="space-y-6">
      {context && (
        <p className="text-xs font-mono text-muted-foreground">{context}</p>
      )}
      <p className="text-lg leading-relaxed">{message}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-mono">From Holzen</span>
          <ShareReflection message={message} context={context} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs font-mono text-muted-foreground"
        >
          Dismiss
        </Button>
      </div>

      {companions && companionPrefs && (
        <CompanionSection
          companions={companions}
          prefs={companionPrefs}
          severity={severity}
        />
      )}
    </div>
  );
}
