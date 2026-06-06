import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeCustomizeLinkButton } from '@/screens/home/components/HomeCustomizeLinkButton';
import {
  hasSeenHomeGreeting,
  markHomeGreetingSeen,
  resolveHomeGreetingVariant,
} from '@/screens/home/lib/home-greeting';

interface HomeGreetingRowProps {
  userId: string | undefined;
  firstName: string | null | undefined;
  onOpenCustomize: () => void;
}

/** Wireframe greeting row: Welcome / Hello, again / Hello, {name} + Customize. */
export function HomeGreetingRow({ userId, firstName, onOpenCustomize }: HomeGreetingRowProps) {
  "use memo";
  const { t } = useTranslation();
  const name = firstName?.trim();
  const hasSeenBefore = useMemo(() => hasSeenHomeGreeting(userId), [userId]);
  const variant = resolveHomeGreetingVariant(firstName, hasSeenBefore);

  useEffect(() => {
    if (!userId || hasSeenBefore) return;
    markHomeGreetingSeen(userId);
  }, [userId, hasSeenBefore]);

  const greetingText = useMemo(() => {
    switch (variant) {
      case 'helloName':
        return t('home.greeting.helloName', { name: name!, defaultValue: 'Hello, {{name}}' });
      case 'welcome':
        return t('home.greeting.welcome', { defaultValue: 'Welcome' });
      case 'helloAgain':
        return t('home.greeting.helloAgain', { defaultValue: 'Hello, again' });
    }
  }, [variant, name, t]);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-base font-medium text-foreground">{greetingText}</p>
      <HomeCustomizeLinkButton
        label={t('home.customize')}
        onClick={onOpenCustomize}
        variant="shrink"
      />
    </div>
  );
}
