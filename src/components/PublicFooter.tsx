import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Twitter } from 'lucide-react';
import { prefetchCoingeckoBtcUsd } from '@/lib/coingecko-btc-usd-query';
import { prefetchBlogPublishedFirstPage } from '@/lib/blog-post-query';

export function PublicFooter() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return (
    <footer className="max-w-lg mx-auto px-6 py-12 space-y-6">
      <div className="border-t border-border/40 pt-6 space-y-4">
        <div className="flex items-center gap-4">
          <a href="https://x.com/holzenapp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow on X">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="https://njump.me/holzen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow on Nostr">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3.07c-1.42-.17-2.7-.8-3.64-1.74l1.42-1.42A4.47 4.47 0 0012 12.5c1.38 0 2.63-.56 3.54-1.46l1.42 1.42A6.47 6.47 0 0113 14.43V17.5h-2z" />
            </svg>
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground/50">{t('landing.contact')}</p>
          <a href="mailto:hello@holzen.app" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            hello@holzen.app
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
          <Link to="/welcome" className="hover:text-foreground transition-colors">Home</Link>
          <span className="text-muted-foreground/20">·</span>
          <Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link>
          <span className="text-muted-foreground/20">·</span>
          <Link
            to="/reserve"
            className="hover:text-foreground transition-colors"
            onMouseEnter={() => void prefetchCoingeckoBtcUsd(queryClient)}
            onFocus={() => void prefetchCoingeckoBtcUsd(queryClient)}
          >
            {t('landing.btcReserve')}
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <Link
            to="/blog"
            className="hover:text-foreground transition-colors"
            onMouseEnter={() => void prefetchBlogPublishedFirstPage(queryClient)}
            onFocus={() => void prefetchBlogPublishedFirstPage(queryClient)}
          >
            {t('landing.blog')}
          </Link>
          <span className="text-muted-foreground/20">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">{t('landing.terms')}</Link>
          <span className="text-muted-foreground/20">·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">{t('landing.privacy')}</Link>
        </div>
      </div>
    </footer>
  );
}