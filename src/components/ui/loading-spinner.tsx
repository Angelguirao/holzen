import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <output
      className={cn(
        "block h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground",
        className,
      )}
      aria-label="Loading"
    />
  );
}

