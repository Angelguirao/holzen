import { BookOpen, GitCompare, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveHistoricalMarketInsight } from '@/features/pause/domain/historical-insight';
import type { CachedHistoricalInsightShape } from '@/features/pause/public-ritual-frame';

export type LookBackFullViewProps = {
  data: CachedHistoricalInsightShape;
};

function formatHistoryByline(data: CachedHistoricalInsightShape): string {
  const asset = data.assetClass?.toUpperCase() ?? 'BITCOIN';
  const period = data.period?.toUpperCase() ?? '';
  if (!period) return asset;
  return `${asset} · ${period}`;
}

/** Split multi-sentence market insight into story + resolution (Figma "HOW IT RESOLVED"). */
function splitMarketInsightBody(body: string): { story: string; resolved?: string } {
  const trimmed = body.trim();
  if (!trimmed) return { story: '' };
  const parts = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length < 2) return { story: trimmed };
  return {
    story: parts.slice(0, -1).join(' ').trim(),
    resolved: parts[parts.length - 1]!.trim(),
  };
}

function analogyHeading(data: CachedHistoricalInsightShape, t: (key: string, opts?: object) => string): string {
  if (data.assetClass) {
    return t('pause.frame.lookBackContent.mirrorMomentWithAsset', { assetClass: data.assetClass });
  }
  return t('pause.frame.lookBackContent.analogyHeading');
}

/** Full-screen Look back — Figma 433:15248 (story → parallel → how it resolved). */
export function LookBackFullView({ data }: LookBackFullViewProps) {
  "use memo";
  const { t } = useTranslation();
  const marketInsight = resolveHistoricalMarketInsight(data);
  const split = marketInsight ? splitMarketInsightBody(marketInsight) : { story: '' };
  const storyBody = split.story || marketInsight || '';
  const resolved = split.resolved;

  return (
    <div className="space-y-6">
      {data.title ? (
        <div className="flex items-start gap-2.5">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium leading-5 tracking-wide text-foreground">
            {data.title}{' '}
            <span className="font-normal italic">{formatHistoryByline(data)}</span>
          </p>
        </div>
      ) : null}

      {storyBody ? (
        <p className="whitespace-pre-wrap text-sm leading-5 tracking-wide text-foreground">{storyBody}</p>
      ) : null}

      {data.analogy ? (
        <>
          {storyBody ? <div className="border-t border-dashed border-border/50" aria-hidden /> : null}
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <GitCompare className="h-5 w-5 text-muted-foreground" aria-hidden />
              <p className="text-base font-medium leading-6 tracking-wide text-foreground">
                {analogyHeading(data, t)}
              </p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-5 tracking-wide text-foreground">{data.analogy}</p>
          </div>
        </>
      ) : null}

      {resolved ? (
        <div className="space-y-2 rounded-lg bg-primary/10 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden />
            <p className="text-sm font-medium leading-5 tracking-wide text-foreground">
              {t('pause.frame.lookBackContent.howItResolved')}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-5 tracking-wide text-foreground">{resolved}</p>
        </div>
      ) : null}
    </div>
  );
}
