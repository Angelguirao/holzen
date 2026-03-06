interface Props {
  haiku: string;
}

export function HaikuDisplay({ haiku }: Props) {
  const lines = haiku.split(/\\n|\n/).map(l => l.trim()).filter(Boolean);

  return (
    <div className="py-3 space-y-1">
      {lines.map((line, i) => (
        <p
          key={i}
          className="text-sm font-mono text-muted-foreground italic leading-relaxed"
        >
          {line}
        </p>
      ))}
    </div>
  );
}
