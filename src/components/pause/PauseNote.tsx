import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { pauseLogStep } from '@/lib/pause-api';
import { supabase } from '@/integrations/supabase/client';

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
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('pause_step_events' as never)
        .select('payload, created_at')
        .eq('pause_instance_id', pauseInstanceId)
        .eq('step_type', 'note_updated')
        .order('created_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const rows = (data ?? []) as Array<{ payload: Record<string, unknown> }>;
      const text = typeof rows[0]?.payload?.text === 'string' ? (rows[0].payload.text as string) : '';
      setNote(text);
    })();
    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId]);

  async function commit(next: string) {
    setSaving(true);
    await pauseLogStep({
      instanceId: pauseInstanceId,
      stepType: 'note_updated',
      payload: { text: next },
    }).catch(() => undefined);
    setSaving(false);
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
