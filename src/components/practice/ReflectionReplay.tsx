/**
 * Pause V2 transitional placeholder.
 *
 * The original "replay a past reflection" practice relied on the legacy
 * `reflections` table and `usePastReflection`. With the V2 cutover the
 * feature needs rebuilding around `v_pause_full` + `pause_ai_artifacts`
 * — tracked as a follow-up. This placeholder keeps the `/tools/practice/replay`
 * route rendering so users land on a clear empty state rather than a
 * 500.
 */

import { useTranslation } from 'react-i18next';

interface Props {
  onComplete?: () => void;
  textColor?: string;
  ringColor?: string;
  /** Reserved for when replay is rebuilt on `v_pause_full` (navigation already passes pause id). */
  initialPauseInstanceId?: string;
}

export function ReflectionReplay({ onComplete }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('practice.replay.comingSoon', {
          defaultValue:
            'Reflection replay is being rebuilt on the new pause model. Check back soon.',
        })}
      </p>
      {onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="text-xs font-mono uppercase tracking-widest text-primary hover:underline"
        >
          {t('common.done', { defaultValue: 'Done' })}
        </button>
      )}
    </div>
  );
}
