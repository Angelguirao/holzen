import { Link, useLocation } from 'react-router-dom';

const SITE_MARKETING =
  import.meta.env.VITE_MARKETING_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:4321';

/**
 * SPA-only dev stub for routes served by Astro in unified deploy.
 * @see docs/ops/marketing-site-split.md
 */
export default function MarketingDevFallback() {
  const { pathname, search } = useLocation();
  const marketingUrl = `${SITE_MARKETING}${pathname}${search}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Holzen</p>
      <h1 className="text-lg font-editorial max-w-md">This page lives in Astro</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        Run <code className="font-mono text-xs">npm run dev:site</code> for marketing pages, or use
        the merged build after <code className="font-mono text-xs">npm run build:unified</code>.
      </p>
      <a
        href={marketingUrl}
        className="text-sm text-nox-text-link underline underline-offset-2"
      >
        Open {pathname} on marketing dev server
      </a>
      <Link to="/auth?view=sign-up" className="text-sm text-muted-foreground hover:text-foreground">
        Continue to sign up in the app
      </Link>
    </div>
  );
}
