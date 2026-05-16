import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImmersivePracticeShell } from '@/components/practice/ImmersivePracticeShell';
import { BodyScan } from '@/components/practice/BodyScan';

const COLORS = {
  textColor: 'hsl(var(--foreground) / 0.7)',
  ringColor: 'hsl(var(--border))',
  glowColor: 'hsl(var(--primary) / 0.1)',
};

export default function PracticeBodyScan() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <ImmersivePracticeShell title={t('practice.bodyscanLabel')}>
      <BodyScan
        onComplete={() => navigate('/', { replace: true })}
        {...COLORS}
      />
    </ImmersivePracticeShell>
  );
}
