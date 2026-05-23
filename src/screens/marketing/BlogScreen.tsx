import { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getBlogPublishedPostsInfiniteQueryOptions,
  prefetchBlogPostBySlug,
} from '@/features/user/public-queries';
import { format } from 'date-fns';
import { PageMeta } from '@/app/components/PageMeta';
import { PublicFooter } from '@/screens/marketing/components/PublicFooter';
import { useInfiniteScroll } from '@/app/hooks/use-infinite-scroll';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/ui/page-heading';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const BlogScreen = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  const {
    data,
    isPending,
    isError,
    refetch,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(getBlogPublishedPostsInfiniteQueryOptions());

  const posts = useMemo(() => data?.pages.flat() ?? [], [data]);
  const hasMore = Boolean(hasNextPage);
  const loadingMore = isFetchingNextPage;

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    try {
      const result = await fetchNextPage();
      if (result.isError) {
        toast.error(t('blog.loadMoreFailed'));
      }
    } catch {
      toast.error(t('blog.loadMoreFailed'));
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, t]);

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

        {isPending ? (
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
        ) : posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post, i) => (
              <motion.div key={post.id} {...m(i * 0.05)}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="block group space-y-2"
                  onMouseEnter={() => void prefetchBlogPostBySlug(queryClient, post.slug)}
                  onFocus={() => void prefetchBlogPostBySlug(queryClient, post.slug)}
                >
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

export default BlogScreen;
