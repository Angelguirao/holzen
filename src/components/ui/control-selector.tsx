import { cn } from "@/lib/utils";

interface ControlSelectorProps {
  options: string[];
  selected: string;
  onChange: (option: string) => void;
  className?: string;
}

export function ControlSelector({ options, selected, onChange, className }: ControlSelectorProps) {
  return (
    <div className={cn("inline-flex rounded-md border border-border p-1", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded px-2 py-1 text-xs transition-colors",
            option === selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

