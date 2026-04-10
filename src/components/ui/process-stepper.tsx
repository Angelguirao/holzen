import { cn } from "@/lib/utils";

interface ProcessStepperProps {
  steps: string[];
  activeIndex: number;
  className?: string;
}

export function ProcessStepper({ steps, activeIndex, className }: ProcessStepperProps) {
  return (
    <ol className={cn("space-y-2", className)}>
      {steps.map((step, idx) => (
        <li
          key={step}
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            idx <= activeIndex ? "border-primary/40 bg-primary/10 text-foreground" : "border-border text-muted-foreground",
          )}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

