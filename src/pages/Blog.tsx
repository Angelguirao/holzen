import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PageMeta } from '@/components/PageMeta';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] },
});

const Blog = () => {
  const prefersReduced = useReducedMotion();
  const m = (delay = 0) => (prefersReduced ? {} : fade(delay));

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-10">
        {/* Nav */}
        <motion.div {...m()} className="flex items-center justify-between">
          <Link
            to="/welcome"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <span className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
            Blog
          </span>
        </motion.div>

        {/* Posts */}
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
        ) : posts && posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post, i) => (
              <motion.div key={post.id} {...m(i * 0.05)}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="block group space-y-2"
                >
                  {post.published_at && (
                    <p className="text-[10px] font-mono text-muted-foreground/70 tracking-wider uppercase">
                      {format(new Date(post.published_at), 'MMM d, yyyy')}
                    </p>
                  )}
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors leading-relaxed">
                    {post.title}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                    Read
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div {...m(0.1)}>
            <div className="space-y-3 py-8">
              <p className="text-sm text-foreground">Nothing here yet.</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We're working on our first posts about behavioral finance, Bitcoin conviction, and the art of doing nothing. Check back soon.
              </p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div {...m()}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border">
            <Link to="/welcome" className="hover:text-foreground transition-colors">Home</Link>
            <span>·</span>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Blog;
