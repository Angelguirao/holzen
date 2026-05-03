export function FilterRow({ label: filterLabel, options, value, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[9px] font-mono text-muted-foreground/50 mr-1">{filterLabel}:</span>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${
            value === opt.value
              ? 'bg-muted/60 text-foreground'
              : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/20'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
