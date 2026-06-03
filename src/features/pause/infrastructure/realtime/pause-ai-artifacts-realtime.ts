import { supabase } from '@/integrations/supabase/client';

/** Subscribe to `pause_ai_artifacts` writes for one pause instance. */
export function subscribePauseAiArtifactsForInstance(
  pauseInstanceId: string,
  channelName: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pause_ai_artifacts',
        filter: `pause_instance_id=eq.${pauseInstanceId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    if (typeof supabase.removeChannel === 'function') {
      supabase.removeChannel(channel);
    }
  };
}
