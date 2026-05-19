import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getBlogPostBySlugQueryOptions } from '@/lib/blog-post-query';
import { format } from 'date-fns';
import { PageMeta } from '@/app/components/PageMeta';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/ui/page-heading';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const BlogPostScreen = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  const { data: post, isLoading, error } = useQuery(getBlogPostBySlugQueryOptions(slug));

  const postTitle = post?.title ? `${post.title} — Holzen Blog` : 'Holzen Blog';
  const postDesc = post?.excerpt || 'Read this article on the Holzen blog.';
  const postPath = slug ? `/blog/${slug}` : '/blog';

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <PageMeta title={postTitle} description={postDesc} path={postPath} />
      <div className="w-full max-w-sm space-y-10">
        <motion.div {...m()}>
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('blog.title')}
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-6 w-3/4 bg-muted rounded" />
            <div className="space-y-2 pt-4">
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          </div>
        ) : error || !post ? (
          <motion.div {...m(0.1)}>
            <div className="space-y-3 py-8">
              <p className="text-sm text-foreground">{t('blog.postNotFound')}</p>
              <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                {t('blog.backToBlog')}
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div {...m(0.05)} className="space-y-3">
              {post.published_at && (
                <p className="text-[10px] font-mono text-muted-foreground/70 tracking-wider uppercase">
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </p>
              )}
              <PageHeading title={post.title} />
              {post.excerpt && <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>}
            </motion.div>

            <motion.div {...m(0.1)}>
              <div className="prose-holzen text-xs text-muted-foreground leading-relaxed space-y-4 whitespace-pre-line">
                {post.body}
              </div>
            </motion.div>
          </>
        )}

        <motion.div {...m()}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border">
            <Link to="/welcome" className="hover:text-foreground transition-colors">{t('blog.home')}</Link>
            <span>·</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">{t('blog.title')}</Link>
            <span>·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">{t('blog.about')}</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPostScreen;
