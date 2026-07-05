import { useActionState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LoadingButton } from '@/components/ui/loading-button';
import { exportDataAction } from '../presentation/settings-export-data-io';

/** Settings → Account JSON/CSV export — legacy; not wired in pause-first MVP. */
export function SettingsAccountDataExportSection() {
  const { t } = useTranslation();
  const [exportState, exportFormAction, exportPending] = useActionState(exportDataAction, {});

  useEffect(() => {
    if (!exportState.success) return;
    if (exportState.format === 'csv') {
      toast.success('CSV exported', {
        description: `${exportState.pauseCount ?? 0} pauses.`,
      });
    } else {
      toast.success('Data exported', {
        description: `${exportState.pauseCount ?? 0} pauses.`,
      });
    }
  }, [exportState.success, exportState.format, exportState.pauseCount]);

  useEffect(() => {
    if (exportState.error === 'not_authenticated') {
      toast.error('Sign in to export data');
    } else if (exportState.error === 'export_failed') {
      toast.error('Export failed');
    }
  }, [exportState.error]);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.data')}</p>
      <div className="flex gap-4">
        <form action={exportFormAction}>
          <input type="hidden" name="format" value="json" />
          <LoadingButton
            type="submit"
            variant="link"
            loading={exportPending}
            loadingText={t('settings.exporting')}
            className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
          >
            {t('settings.exportJson')}
          </LoadingButton>
        </form>
        <form action={exportFormAction}>
          <input type="hidden" name="format" value="csv" />
          <LoadingButton
            type="submit"
            variant="link"
            loading={exportPending}
            loadingText={t('settings.exporting')}
            className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
          >
            {t('settings.exportCsv')}
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
