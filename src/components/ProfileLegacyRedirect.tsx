import { Navigate, useLocation } from 'react-router-dom';
import { parseProfileLocationState, type ProfileTab } from '@/lib/router-location-state';
import { journeyPath, isProfileTab } from '@/lib/app-routes';

/**
 * `/profile` was the pre–IA-refresh path. Resolves `location.state` (tab, letter)
 * into the new `/journey/...` URL so notification deep links keep working
 * for users mid-session before DB rows are backfilled.
 */
export function ProfileLegacyRedirect() {
  const location = useLocation();
  const { tab, letterId } = parseProfileLocationState(location.state);
  const t: ProfileTab = tab && isProfileTab(tab) ? tab : 'stats';
  const to = journeyPath(t, letterId ? { letterId } : undefined);
  return <Navigate to={to} replace />;
}
