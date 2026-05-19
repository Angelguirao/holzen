import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { heroQuoteIndexForDay, utcYmd, HERO_QUOTE_LINE_KEY_GROUPS } from '@/lib/home-hero-quote';

interface HomeHeroQuoteProps {
  userId: string | undefined;
  firstName: string | null | undefined;
}

export function HomeHeroQuote({ userId, firstName }: HomeHeroQuoteProps) {
  const { t } = useTranslation();

  const lines = useMemo(() => {
    const idx = heroQuoteIndexForDay(userId, utcYmd());
    const keys = HERO_QUOTE_LINE_KEY_GROUPS[idx] ?? HERO_QUOTE_LINE_KEY_GROUPS[0];
    const raw = keys.map((k) => t(k));
    if (raw.length === 0) return [];
    const withName = firstName
      ? [t('home.heroQuote.lineWithName', { name: firstName, line: raw[0] }), ...raw.slice(1)]
      : raw;
    return withName;
  }, [userId, firstName, t]);

  return (
    <div className="space-y-1 pr-16">
      {lines.map((line, i) => (
        <p key={i} className="text-base font-medium leading-relaxed text-foreground">
          {line}
        </p>
      ))}
    </div>
  );
}
