import { useTranslation } from 'react-i18next';
import { HomeCustomizeLinkButton } from '@/screens/home/components/HomeCustomizeLinkButton';

interface HomeGreetingRowProps {
  firstName: string | null | undefined;
  onOpenCustomize: () => void;
}

/** Wireframe greeting row: Hello + Customize (replaces hero quote placement). */
export function HomeGreetingRow({ firstName, onOpenCustomize }: HomeGreetingRowProps) {
  "use memo";
  const { t } = useTranslation();
  const name = firstName?.trim();

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-base font-medium text-foreground">
        {name
          ? t('home.greeting.helloName', { name, defaultValue: 'Hello, {{name}}' })
          : t('home.greeting.hello', { defaultValue: 'Hello' })}
      </p>
      <HomeCustomizeLinkButton
        label={t('home.customize')}
        onClick={onOpenCustomize}
        variant="shrink"
      />
    </div>
  );
}
