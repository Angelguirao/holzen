import { Navigate, useLocation } from 'react-router-dom';

/** Old bookmark `/journey/letters` → canonical `/tools/letters` (preserves `?letter=`). */
export default function JourneyLettersRedirect() {
  const { search } = useLocation();
  return <Navigate to={search ? `/tools/letters${search}` : '/tools/letters'} replace />;
}
