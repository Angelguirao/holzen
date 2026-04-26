import { useTranslation } from 'react-i18next';
import { NoxHeaderMain } from '@/components/ui/nox-header';

/**
 * Placeholder for the new Calendar tab introduced in the IA refactor (Step 1).
 * The unified usage + Bitcoin events timeline lands in Step 6.
 */
const Calendar = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <NoxHeaderMain
        title={t('nav.calendar')}
        subtitle={t('calendar.placeholderSubtitle', {
          defaultValue: 'A timeline of your pauses and Bitcoin events.',
        })}
      />
      <p className="text-sm text-muted-foreground">
        {t('calendar.placeholderBody', {
          defaultValue: 'Coming next in the refactor.',
        })}
      </p>
    </div>
  );
};

export default Calendar;