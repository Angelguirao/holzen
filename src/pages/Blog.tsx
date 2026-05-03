import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PageMeta } from '@/components/PageMeta';
import { PublicFooter } from '@/components/PublicFooter';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/PageHeading';

const PAGE_SIZE = 20;

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
}

const Blog = () => {
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['blog-posts-initial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      const rows = (data ?? []) as BlogPost[];
      setPosts(rows);
      setHasMore(rows.length === PAGE_SIZE);
      return rows;
    },
  });

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const last = posts[posts.length - 1];
    if (!last?.published_at) { setLoadingMore(false); return; }
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .lt('published_at', last.published_at)
      .limit(PAGE_SIZE);
    if (error) {
      toast.error(t('blog.loadMoreFailed'));
      setLoadingMore(false);
      return;
    }
    const rows = (data ?? []) as BlogPost[];
    setPosts((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, posts, t]);

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <PageMeta
        title="Holzen Blog — Bitcoin psychology, behavioral finance & self-awareness"
        description="Articles on Bitcoin conviction, behavioral finance, and the art of pausing before you act. From the team behind Holzen."
        path="/blog"
      />
      <div className="w-full max-w-sm space-y-10">
        <motion.div {...m()} className="flex items-center justify-between">
          <Link to="/welcome" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common.back')}
          </Link>
        </motion.div>
        <PageHeading title={t('blog.title')} />

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <motion.div {...m(0.1)} className="space-y-4 py-8">
            <p className="text-sm text-foreground">{t('blog.loadFailed')}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline disabled:opacity-50"
            >
              {t('common.tryAgain')}
            </button>
          </motion.div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post, i) => (
              <motion.div key={post.id} {...m(i * 0.05)}>
                <Link to={`/blog/${post.slug}`} className="block group space-y-2">
                  {post.published_at && (
                    <p className="text-[10px] font-mono text-muted-foreground/70 tracking-wider uppercase">
                      {format(new Date(post.published_at), 'MMM d, yyyy')}
                    </p>
                  )}
                  <p className="text-sm text-foreground group-hover:text-nox-text-link transition-colors leading-relaxed">{post.title}</p>
                  {post.excerpt && <p className="text-xs text-muted-foreground leading-relaxed">{post.excerpt}</p>}
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                    {t('blog.read')}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center">{t('common.loadingMore')}</p>
            )}
          </div>
        ) : (
          <motion.div {...m(0.1)}>
            <div className="space-y-3 py-8">
              <p className="text-sm text-foreground">{t('blog.nothingYet')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('blog.nothingDesc')}</p>
            </div>
          </motion.div>
        )}

        <PublicFooter />
      </div>
    </div>
  );
};

export default Blog;
