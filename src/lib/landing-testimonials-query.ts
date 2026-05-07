import { supabase } from '@/integrations/supabase/client';

export interface LandingTestimonialRow {
  id: string;
  display_name: string;
  quote: string;
}

/** Public landing slice — shared cache if multiple trees mount this block. */
export const LANDING_TESTIMONIALS_QUERY_KEY = ['testimonials', 'landing', { approved: true, limit: 6 }] as const;

export async function fetchLandingTestimonials(): Promise<LandingTestimonialRow[]> {
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, display_name, quote')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(6);
  if (error || !data?.length) return [];
  return data as LandingTestimonialRow[];
}

export function getLandingTestimonialsQueryOptions() {
  return {
    queryKey: LANDING_TESTIMONIALS_QUERY_KEY,
    queryFn: fetchLandingTestimonials,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
