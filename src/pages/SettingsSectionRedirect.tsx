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

/** Legacy `/settings/section/:id` → `/settings/:id`. */
export default function SettingsSectionRedirect() {
  const { section = '' } = useParams();
  if (!VALID.has(section)) {
    return <Navigate to="/settings" replace />;
  }
  return <Navigate to={`/settings/${encodeURIComponent(section)}`} replace />;
}
