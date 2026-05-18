import { useEffect } from 'react';
import { SITE_ORIGIN } from '@/config/site';

interface PageMetaProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}
const DEFAULT_TITLE = 'Holzen — Pause before you act';

export function PageMeta({ title, description, path, noindex }: PageMetaProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Canonical
    if (path !== undefined) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.href = `${SITE_ORIGIN}${path}`;
    }

    // OG tags
    setMeta('og:title', title);
    setMeta('og:description', description);
    if (path !== undefined) setMeta('og:url', `${SITE_ORIGIN}${path}`);

    // Twitter tags
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    // Robots
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, path, noindex]);

  return null;
}

function setMeta(property: string, content: string) {
  const isOg = property.startsWith('og:');
  const selector = isOg
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (isOg) {
      el.setAttribute('property', property);
    } else {
      el.setAttribute('name', property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
