import { getSupabaseClient } from './supabase';

export type BlogListPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
};

export type BlogPost = BlogListPost & {
  body: string;
};

const LIST_PAGE_SIZE = 100;

export async function fetchAllPublishedBlogPosts(): Promise<BlogListPost[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const rows: BlogListPost[] = [];
  let cursor: string | null = null;

  for (;;) {
    let q = supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(LIST_PAGE_SIZE);
    if (cursor) q = q.lt('published_at', cursor);

    const { data, error } = await q;
    if (error) {
      console.warn('[blog] fetch list failed:', error.message);
      return rows;
    }
    const page = (data ?? []) as BlogListPost[];
    rows.push(...page);
    if (page.length < LIST_PAGE_SIZE) break;
    const last = page[page.length - 1];
    if (!last?.published_at) break;
    cursor = last.published_at;
  }

  return rows;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, published_at, body')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.warn(`[blog] fetch slug=${slug} failed:`, error.message);
    return null;
  }
  return data as BlogPost | null;
}

export function formatBlogDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const date = new Date(iso);
  return date.toLocaleDateString(
    'en-US',
    style === 'long'
      ? { month: 'long', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' },
  );
}
