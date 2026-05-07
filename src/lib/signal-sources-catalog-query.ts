import { supabase } from '@/integrations/supabase/client';

export interface CatalogSource {
  id: string;
  name: string;
  type: string;
  url: string | null;
  description: string | null;
  category: string;
}

export const SIGNAL_SOURCES_CATALOG_QUERY_KEY = ['signal-sources', 'catalog'] as const;

export async function fetchSignalSourcesCatalog(): Promise<CatalogSource[]> {
  const { data, error } = await supabase.from('signal_sources').select('*').order('name');
  if (error) throw error;
  return (data as unknown as CatalogSource[]) ?? [];
}

export function getSignalSourcesCatalogQueryOptions(enabled: boolean) {
  return {
    queryKey: SIGNAL_SOURCES_CATALOG_QUERY_KEY,
    queryFn: fetchSignalSourcesCatalog,
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
