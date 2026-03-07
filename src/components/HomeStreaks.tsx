import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ReflectionStats } from './ReflectionStats';

interface Props {
  streakFreezeDates: string[];
  onUseFreeze: () => Promise<void>;
}

export function HomeStreaks({ streakFreezeDates, onUseFreeze }: Props) {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<{ created_at: string; outcome: string | null }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('created_at, outcome')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReflections(data ?? []);
        setLoaded(true);
      });
  }, [user]);

  if (!loaded || reflections.length === 0) return null;

  return (
    <ReflectionStats
      reflections={reflections}
      streakFreezeDates={streakFreezeDates}
      onUseFreeze={onUseFreeze}
    />
  );
}
