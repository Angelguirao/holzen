import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  title: string;
  body: string;
  source: string;
  url: string;
}

interface SignalDisplayProps {
  signal: Props | null;
  loading: boolean;
  error: boolean;
}

export function SignalDisplay({ signal, loading, error }: SignalDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <p className="text-xs text-muted-foreground/50 italic">
        Couldn't load signal right now.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium leading-snug">{signal.title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{signal.body}</p>
      <a
        href={signal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
      >
        <ExternalLink className="h-2.5 w-2.5" />
        {signal.source}
      </a>
    </div>
  );
}
