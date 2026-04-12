import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImmersivePracticeShell } from '@/components/practice/ImmersivePracticeShell';
import { ReflectionReplay } from '@/components/practice/ReflectionReplay';

const COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
};

export default function PracticeReplay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const reflectionId = (location.state as { reflectionId?: string } | undefined)?.reflectionId;

  return (
    <ImmersivePracticeShell title={t('practice.replayLabel')}>
      <ReflectionReplay
        initialReflectionId={reflectionId}
        onComplete={() => navigate('/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
