import { getAuthUser } from '@/features/auth/public';
import { fetchSettingsDataExportBundle } from '@/features/pause/public-hooks';
import { fetchProfileRowForUser } from '@/features/user/public-queries';

export type ExportDataFormat = 'json' | 'csv';

export type ExportDataActionState = {
  error?: 'not_authenticated' | 'export_failed';
  success?: boolean;
  format?: ExportDataFormat;
  pauseCount?: number;
};

export async function buildSettingsExportDownload(
  userId: string,
  format: ExportDataFormat,
): Promise<{ pauseCount: number; download: () => void }> {
  const [profile, exportBundle] = await Promise.all([
    fetchProfileRowForUser(userId),
    fetchSettingsDataExportBundle(userId),
  ]);

  const pauseRows = exportBundle.pauses;
  const stepEvents = exportBundle.stepEvents;
  const companionEvents = exportBundle.companionEvents;
  const artifacts = exportBundle.aiArtifacts;
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === 'csv') {
    const refHeaders = [
      'created_at',
      'state',
      'initial_mood',
      'shift_mood',
      'outcome',
      'note_text',
      'tags',
      'is_favorite',
      'counted_companion_types',
      'reflection_text',
    ];
    const refRows = pauseRows.map((r) =>
      refHeaders
        .map((h) => {
          const val = Array.isArray(r[h]) ? (r[h] as unknown[]).join('; ') : r[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(','),
    );
    const refCsv = [refHeaders.join(','), ...refRows].join('\n');

    return {
      pauseCount: pauseRows.length,
      download: () => {
        const refBlob = new Blob([refCsv], { type: 'text/csv' });
        const refUrl = URL.createObjectURL(refBlob);
        const a1 = document.createElement('a');
        a1.href = refUrl;
        a1.download = `holzen-pauses-${dateStr}.csv`;
        a1.click();
        URL.revokeObjectURL(refUrl);
      },
    };
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    profile: profile
      ? {
          threshold: profile.threshold,
          threshold_down: profile.threshold_down,
          cooldown_hours: profile.cooldown_hours,
          reflection_tone: profile.reflection_tone,
          reflection_style: profile.reflection_style,
          language: profile.language,
          email_notifications: profile.email_notifications,
          created_at: profile.created_at,
        }
      : null,
    pauses: pauseRows,
    step_events: stepEvents,
    companion_events: companionEvents,
    ai_artifacts: artifacts,
  };

  return {
    pauseCount: pauseRows.length,
    download: () => {
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `holzen-export-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  };
}

export async function exportDataAction(
  _prev: ExportDataActionState,
  formData: FormData,
): Promise<ExportDataActionState> {
  const formatRaw = String(formData.get('format') ?? 'json');
  const format: ExportDataFormat = formatRaw === 'csv' ? 'csv' : 'json';

  const user = await getAuthUser();
  if (!user) {
    return { error: 'not_authenticated' };
  }

  try {
    const { pauseCount, download } = await buildSettingsExportDownload(user.id, format);
    download();
    return { success: true, format, pauseCount };
  } catch {
    return { error: 'export_failed' };
  }
}
