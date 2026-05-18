import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { pauseArchiveListQueryPrefix } from '@/lib/pause-archive-list-query';
import { pauseLogStep } from '@/features/pause/public-rpc';
import {
  getLatestPauseReflectNoteQueryOptions,
  PAUSE_REFLECT_STEP_NOTE,
  pauseReflectStepLatestQueryKey,
} from '@/lib/pause-reflect-step-queries';

interface Props {
  pauseInstanceId: string;
}

/**
 * V2 note editor — logs a note_updated step event via the RPC.
 * Initial text is hydrated from the latest note_updated event on
 * this instance.
 */
export function PauseNote({ pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: serverNote = '' } = useQuery(getLatestPauseReflectNoteQueryOptions(pauseInstanceId));

  useEffect(() => {
    setNote(serverNote);
  }, [pauseInstanceId, serverNote]);

  async function commit(next: string) {
    setSaving(true);
    try {
      await pauseLogStep({
        instanceId: pauseInstanceId,
        stepType: 'note_updated',
        payload: { text: next },
      });
      if (user?.id) {
        void queryClient.invalidateQueries({ queryKey: pauseArchiveListQueryPrefix(user.id) });
      }
      void queryClient.invalidateQueries({
        queryKey: pauseReflectStepLatestQueryKey(pauseInstanceId, PAUSE_REFLECT_STEP_NOTE),
      });
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Pencil className="h-3 w-3" aria-hidden />
        {t('pause.reflect.noteLabel', { defaultValue: 'Your note' })}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => void commit(note)}
        placeholder={t('pause.reflect.notePlaceholder', {
          defaultValue: 'What felt important? What would you tell yourself tomorrow?',
        })}
        className="min-h-20 w-full resize-y rounded-md border border-border/60 bg-muted/30 p-2 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
        disabled={saving}
      />
    </div>
  );
}
