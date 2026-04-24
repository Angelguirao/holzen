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
  const state = location.state as { pauseInstanceId?: string; returnTo?: string } | undefined;
  const pauseInstanceId = state?.pauseInstanceId;
  const returnTo = state?.returnTo;

  const handleClose = returnTo
    ? () => navigate(returnTo, { replace: true })
    : undefined;

  return (
    <ImmersivePracticeShell title={t('practice.replayLabel')} onClose={handleClose}>
      <ReflectionReplay
        initialPauseInstanceId={pauseInstanceId}
        onComplete={() => navigate(returnTo ?? '/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
