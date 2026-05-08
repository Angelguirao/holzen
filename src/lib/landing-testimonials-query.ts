import { supabase } from '@/integrations/supabase/client';

export interface LandingTestimonialRow {
  id: string;
  display_name: string;
  quote: string;
}

export const LANDING_TESTIMONIALS_QUERY_PREFIX = ['testimonials', 'landing'] as const;

/** Stable object identity for the query key’s filter segment (must match `fetchLandingTestimonials`). */
export const LANDING_TESTIMONIALS_QUERY_PARAMS = { approved: true, limit: 6 } as const;

/** Public landing slice — shared cache if multiple trees mount this block. */
export const LANDING_TESTIMONIALS_QUERY_KEY = [
  ...LANDING_TESTIMONIALS_QUERY_PREFIX,
  LANDING_TESTIMONIALS_QUERY_PARAMS,
] as const;

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
