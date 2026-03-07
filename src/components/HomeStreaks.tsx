import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { ReflectionStats } from './ReflectionStats';

export function HomeStreaks() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<{ created_at: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('reflections')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReflections(data ?? []);
        setLoaded(true);
      });
  }, [user]);

  if (!loaded || reflections.length === 0) return null;

  return <ReflectionStats reflections={reflections} />;
}
