import { Share2, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { HolzenScoreData } from '@/hooks/use-holzen-score';
import { MOOD_GLYPHS } from '@/components/icons/MoodIcon';

interface Props {
  reflectionCount: number;
  scoreData: HolzenScoreData | null;
  moodCounts: Record<string, number>;
}

function buildShareText({ reflectionCount, scoreData, moodCounts }: Props, t: (k: string, opts?: any) => string): string {
  const lines: string[] = [t('share.myStats')];
  lines.push('');
  lines.push(`📊 ${t('share.reflectionsCount', { count: reflectionCount })}`);

  if (scoreData) {
    lines.push(`🎯 ${t('share.holzenScoreShare', { score: scoreData.score, trend: scoreData.trend })}`);
    lines.push(`  ${t('profile.moodLabel')} ${scoreData.moodScore} · ${t('profile.actionsLabel')} ${scoreData.outcomeScore} · ${t('profile.streakLabel')} ${scoreData.streakScore}`);
  }

  const entries = Object.entries(moodCounts).filter(([, c]) => c > 0);
  if (entries.length > 0) {
    lines.push('');
    lines.push(`${t('share.moodBreakdown')}:`);
    for (const [mood, count] of entries.sort((a, b) => b[1] - a[1])) {
      const emoji = MOOD_EMOJI[mood] || '•';
      lines.push(`  ${emoji} ${t(`moodCheck.moods.${mood}`, mood)}: ${count}`);
    }
  }

  lines.push('');
  lines.push('holzen.lovable.app');
  return lines.join('\n');
}

export function ShareStats(props: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const text = buildShareText(props, t);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch { /* cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast(t('share.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast(t('share.couldNotCopy'));
    }
  }, [props, t]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded bg-muted/40 hover:bg-muted/60"
      aria-label={t('share.share')}
    >
      {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
      <span>{copied ? t('share.copied') : t('share.share')}</span>
    </button>
  );
}
