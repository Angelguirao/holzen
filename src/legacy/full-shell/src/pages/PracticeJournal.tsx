import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImmersivePracticeShell } from '@/legacy/full-shell/src/components/practice/ImmersivePracticeShell';
import { GuidedJournal } from '@/legacy/full-shell/src/components/practice/GuidedJournal';

const COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
};

export default function PracticeJournal() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ImmersivePracticeShell title={t('practice.journalLabel')}>
      <GuidedJournal
        onComplete={() => navigate('/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
