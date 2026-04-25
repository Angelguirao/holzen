import { Navigate, useLocation } from 'react-router-dom';

/** Used when replacing a legacy path with a new canonical URL while keeping `location.state`. */
export function PreserveStateRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={to} replace state={location.state} />;
}
