import { Navigate, useParams } from 'react-router-dom';

const VALID = new Set([
  'you',
  'reflection',
  'experience',
  'companions',
  'notifications',
  'subscription',
  'account',
]);

/** Resolves to `/settings#…` so the main Settings page opens the right accordion. */
export default function SettingsSectionRedirect() {
  const { section = '' } = useParams();
  if (!VALID.has(section)) {
    return <Navigate to="/settings" replace />;
  }
  return (
    <Navigate
      to={{ pathname: '/settings', hash: `settings-section-${section}` }}
      replace
    />
  );
}
