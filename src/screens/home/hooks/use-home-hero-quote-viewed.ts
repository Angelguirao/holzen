import { useEffect, useRef } from 'react';
import { heroQuoteIndexForDay, utcYmd } from '@/screens/home/lib/home-hero-quote';
import { trackHomeHeroQuoteViewed } from '@/screens/home/lib/home-screen-telemetry';

export function useHomeHeroQuoteViewed(profileLoaded: boolean, userId: string | undefined): void {
  const tracked = useRef(false);
  useEffect(() => {
    if (!profileLoaded || tracked.current) return;
    tracked.current = true;
    const ymd = utcYmd();
    trackHomeHeroQuoteViewed(heroQuoteIndexForDay(userId, ymd), ymd);
  }, [profileLoaded, userId]);
}
