import { Button } from '@/components/ui/button';

interface Props {
  message: string;
  context: string | null;
  onDismiss: () => void;
}

export function ReflectionMessage({ message, context, onDismiss }: Props) {
  return (
    <div className="space-y-6">
      {context && (
        <p className="text-xs font-mono text-muted-foreground">{context}</p>
      )}
      <p className="text-lg leading-relaxed">{message}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">From Holzen</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs font-mono text-muted-foreground"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
