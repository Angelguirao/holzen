import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/posthog';
import { heroQuoteIndexForDay, utcYmd } from '@/screens/home/lib/home-hero-quote';

export function useHomeHeroQuoteViewed(profileLoaded: boolean, userId: string | undefined): void {
  const tracked = useRef(false);
  useEffect(() => {
    if (!profileLoaded || tracked.current) return;
    tracked.current = true;
    const ymd = utcYmd();
    trackEvent('home.hero_quote_viewed', {
      quote_index: heroQuoteIndexForDay(userId, ymd),
      utc_ymd: ymd,
    });
  }, [profileLoaded, userId]);
}
