import { RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry: () => void;
}

export function ErrorRetry({ message = 'Something went wrong', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-[10px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}
