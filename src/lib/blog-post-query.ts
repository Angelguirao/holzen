import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];

export function blogPostBySlugQueryKey(slug: string) {
  return ['blog-post', slug] as const;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) throw error;
  return data as BlogPostRow | null;
}

/** Shared TanStack options for `/blog/:slug` (stable key + single `queryFn`). */
export function getBlogPostBySlugQueryOptions(slug: string | undefined) {
  return {
    queryKey: slug ? blogPostBySlugQueryKey(slug) : (['blog-post', 'none'] as const),
    queryFn: () => fetchBlogPostBySlug(slug!),
    enabled: Boolean(slug),
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
