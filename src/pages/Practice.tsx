import { useTranslation } from 'react-i18next';
import { NoxHeaderMain } from '@/components/ui/nox-header';

/**
 * Placeholder for the new Practice tab introduced in the IA refactor (Step 1).
 * Real consolidation of Quick / Deeper tools lands in Step 3.
 */
const Practice = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <NoxHeaderMain
        title={t('nav.practice')}
        subtitle={t('practice.placeholderSubtitle', {
          defaultValue: 'Use between pauses, or whenever you want.',
        })}
      />
      <p className="text-sm text-muted-foreground">
        {t('practice.placeholderBody', {
          defaultValue:
            'Quick and Deeper practices will appear here. Coming next in the refactor.',
        })}
      </p>
    </div>
  );
};

export default Practice;