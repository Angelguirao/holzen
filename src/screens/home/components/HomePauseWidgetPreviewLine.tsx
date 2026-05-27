import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import type { HomePauseWidgetPreviewLine } from '@/features/pause/domain/home/resolve-home-pause-widget-preview-line';

type Props = {
  previewLine: HomePauseWidgetPreviewLine;
};

/** Empathy / opening line for Home pause widget (template or reflection_text). */
export function HomePauseWidgetPreviewLine({ previewLine }: Props) {
  "use memo";
  const { t } = useTranslation();

  if (previewLine.kind === 'none') return null;

  if (previewLine.kind === 'loading') {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (previewLine.kind === 'template') {
    return (
      <p className={`${homeInWidget.bodyMuted} leading-relaxed`}>{t(previewLine.i18nKey)}</p>
    );
  }

  return <p className={`${homeInWidget.bodyLead} leading-relaxed`}>{previewLine.text}</p>;
}
