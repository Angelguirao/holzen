import { cn } from "@/lib/utils";

interface ValueEquivalenceProps {
  primary: string;
  secondary: string;
  className?: string;
}

export function ValueEquivalence({ primary, secondary, className }: ValueEquivalenceProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5", className)}>
      <span className="text-sm font-medium">{primary}</span>
      <span className="text-xs text-muted-foreground">=</span>
      <span className="text-sm text-muted-foreground">{secondary}</span>
    </div>
  );
}

