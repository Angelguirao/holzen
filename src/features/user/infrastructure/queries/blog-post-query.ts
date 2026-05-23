import type { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];

/** Page size for the public `/blog` infinite list (must stay aligned with `getNextPageParam`). */
export const BLOG_PUBLISHED_LIST_PAGE_SIZE = 20;

export type BlogPublishedListRow = Pick<
  BlogPostRow,
  'id' | 'slug' | 'title' | 'excerpt' | 'published_at'
>;

export const BLOG_PUBLISHED_POSTS_QUERY_PREFIX = ['blog-posts', 'published'] as const;

export function blogPublishedPostsInfiniteQueryKey(
  pageSize: number = BLOG_PUBLISHED_LIST_PAGE_SIZE,
) {
  return [...BLOG_PUBLISHED_POSTS_QUERY_PREFIX, pageSize] as const;
}

export async function fetchBlogPublishedPostsPage(
  cursor: string | null,
  pageSize: number = BLOG_PUBLISHED_LIST_PAGE_SIZE,
): Promise<BlogPublishedListRow[]> {
  let q = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(pageSize);
  if (cursor) {
    q = q.lt('published_at', cursor);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as BlogPublishedListRow[];
}

/** Cursor for the next `/blog` page (`published_at` of the last row). */
export function blogPublishedPostsNextPageParam(
  lastPage: BlogPublishedListRow[],
  pageSize: number = BLOG_PUBLISHED_LIST_PAGE_SIZE,
): string | undefined {
  if (lastPage.length < pageSize) return undefined;
  const last = lastPage[lastPage.length - 1];
  if (!last?.published_at) return undefined;
  return last.published_at;
}

/** Shared `useInfiniteQuery` bundle for the public `/blog` index. */
export function getBlogPublishedPostsInfiniteQueryOptions() {
  const pageSize = BLOG_PUBLISHED_LIST_PAGE_SIZE;
  return {
    queryKey: blogPublishedPostsInfiniteQueryKey(pageSize),
    queryFn: ({ pageParam }) =>
      fetchBlogPublishedPostsPage((pageParam as string | null) ?? null, pageSize),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: BlogPublishedListRow[]) =>
      blogPublishedPostsNextPageParam(lastPage, pageSize),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  };
}

export const BLOG_POST_BY_SLUG_QUERY_PREFIX = ['blog-post'] as const;

export const BLOG_POST_BY_SLUG_DISABLED_SLUG = 'none' as const;

export function blogPostBySlugQueryKey(slug: string) {
  return [...BLOG_POST_BY_SLUG_QUERY_PREFIX, slug] as const;
}

/** Placeholder when `slug` is missing; paired with `enabled: false` in `getBlogPostBySlugQueryOptions`. */
export const BLOG_POST_BY_SLUG_NONE_QUERY_KEY = [
  ...BLOG_POST_BY_SLUG_QUERY_PREFIX,
  BLOG_POST_BY_SLUG_DISABLED_SLUG,
] as const;

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
    queryKey: slug ? blogPostBySlugQueryKey(slug) : BLOG_POST_BY_SLUG_NONE_QUERY_KEY,
    queryFn: () => fetchBlogPostBySlug(slug!),
    enabled: Boolean(slug),
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

/** Warm `/blog/:slug` cache from the index (hover / keyboard focus). */
export function prefetchBlogPostBySlug(queryClient: QueryClient, slug: string): Promise<void> {
  return queryClient.prefetchQuery(getBlogPostBySlugQueryOptions(slug));
}

/** Warm the first page of the public `/blog` list before navigation. */
export function prefetchBlogPublishedFirstPage(queryClient: QueryClient): Promise<void> {
  return queryClient.prefetchInfiniteQuery(getBlogPublishedPostsInfiniteQueryOptions());
}
