import { BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { estimateReadTime } from './read-time-util';

interface Props {
  /** Total character count of the content the user will read. */
  chars: number;
  /** Optional extra class on the wrapper. */
  className?: string;
}

/**
 * Small read-time indicator intended for companion Full View pages.
 * Deliberately quiet visually — mono + muted — so it supports the content,
 * not competes with it. Copy keys live under `companions.fullview.readTime.*`.
 */
export function ReadTime({ chars, className = '' }: Props) {
  const { t } = useTranslation();
  const est = estimateReadTime(chars);

  const label =
    est.kind === 'glance'
      ? t('companions.fullview.readTime.glance')
      : est.kind === 'thirty'
      ? t('companions.fullview.readTime.thirty')
      : est.kind === 'ninety'
      ? t('companions.fullview.readTime.ninety')
      : t('companions.fullview.readTime.minutes', { n: est.minutes });

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/55 ${className}`}
    >
      <BookOpen className="h-2.5 w-2.5" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
