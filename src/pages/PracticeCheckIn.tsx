import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImmersivePracticeShell } from '@/components/practice/ImmersivePracticeShell';
import { EmotionalCheckIn } from '@/components/practice/EmotionalCheckIn';

const COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
  glowColor: 'hsl(var(--primary) / 0.1)',
};

export default function PracticeCheckIn() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ImmersivePracticeShell title={t('practice.checkinLabel')}>
      <EmotionalCheckIn
        onComplete={() => navigate('/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
