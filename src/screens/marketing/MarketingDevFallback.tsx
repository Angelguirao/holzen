import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SITE_MARKETING =
  import.meta.env.VITE_MARKETING_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:4321';

const STATIC_MARKETING_RELOAD_KEY = 'holzen-marketing-static-reload';

/**
 * Dev: stub pointing at Astro dev server.
 * Prod: force a full document load so Vercel serves Astro HTML (not this SPA route).
 * @see docs/ops/marketing-site-split.md
 */
export default function MarketingDevFallback() {
  const { pathname, search } = useLocation();
  const [reloadBlocked, setReloadBlocked] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const key = `${STATIC_MARKETING_RELOAD_KEY}:${pathname}`;
    if (sessionStorage.getItem(key)) {
      setReloadBlocked(true);
      return;
    }

    sessionStorage.setItem(key, '1');
    window.location.replace(`${pathname}${search}`);
  }, [pathname, search]);

  if (import.meta.env.PROD) {
    if (reloadBlocked) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 text-center gap-4">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">Holzen</p>
          <h1 className="text-lg font-editorial max-w-md">Could not load the marketing page</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try a hard refresh. If this persists, the latest deploy may be missing merged Astro output.
          </p>
          <a
            href={`${pathname}${search}`}
            className="text-sm text-nox-text-link underline underline-offset-2"
          >
            Open {pathname} again
          </a>
          <Link to="/auth?view=sign-up" className="text-sm text-muted-foreground hover:text-foreground">
            Continue to sign up in the app
          </Link>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

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
