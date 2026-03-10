import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImmersivePracticeShell } from '@/components/practice/ImmersivePracticeShell';
import { ReflectionReplay } from '@/components/practice/ReflectionReplay';

const COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
};

export default function PracticeReplay() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ImmersivePracticeShell title={t('practice.replayLabel')}>
      <ReflectionReplay
        onComplete={() => navigate('/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
