import { Share2, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { HolzenScoreData } from '@/hooks/use-holzen-score';

interface Props {
  reflectionCount: number;
  scoreData: HolzenScoreData | null;
  moodCounts: Record<string, number>;
}

const MOOD_EMOJI: Record<string, string> = {
  fomo: '🔥', excited: '⚡', greedy: '🤑', anxious: '😰',
  calm: '🧘', detached: '😶', uncertain: '🤔', fearful: '😨',
};

function buildShareText({ reflectionCount, scoreData, moodCounts }: Props): string {
  const lines: string[] = ['My Holzen Stats 🧘‍♂️'];
  lines.push('');
  lines.push(`📊 ${reflectionCount} reflections`);

  if (scoreData) {
    lines.push(`🎯 Holzen Score: ${scoreData.score}/100 (${scoreData.trend})`);
    lines.push(`  Mood ${scoreData.moodScore} · Actions ${scoreData.outcomeScore} · Streak ${scoreData.streakScore}`);
  }

  const entries = Object.entries(moodCounts).filter(([, c]) => c > 0);
  if (entries.length > 0) {
    lines.push('');
    lines.push('Mood breakdown:');
    for (const [mood, count] of entries.sort((a, b) => b[1] - a[1])) {
      const emoji = MOOD_EMOJI[mood] || '•';
      lines.push(`  ${emoji} ${mood}: ${count}`);
    }
  }

  lines.push('');
  lines.push('holzen.lovable.app');
  return lines.join('\n');
}

export function ShareStats(props: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const text = buildShareText(props);

    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast('Stats copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy stats');
    }
  }, [props]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded bg-muted/40 hover:bg-muted/60"
      aria-label="Share stats"
    >
      {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
      <span>{copied ? 'Copied' : 'Share'}</span>
    </button>
  );
}
