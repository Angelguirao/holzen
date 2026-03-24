export function QualityBadge({ score }: { score: number }) {
  if (score >= 3) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">curated</span>;
  if (score >= 2) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">good</span>;
  return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">low</span>;
}
