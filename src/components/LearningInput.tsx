interface Props {
  title: string;
  body: string;
}

export function LearningInput({ title, body }: Props) {
  return (
    <div className="py-3 space-y-1">
      <p className="text-xs font-mono font-medium text-foreground/80">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
