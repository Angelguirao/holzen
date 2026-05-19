export function QualityBadge({ score }: { score: number }) {
  if (score >= 3) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-muted/50 text-nox-text-link">curated</span>;
  if (score >= 2) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">good</span>;
  return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">low</span>;
}
