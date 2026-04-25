import { Outlet } from 'react-router-dom';

/** Outer shell for all `/settings/*` routes. Heavy settings state is only loaded under `SettingsStateLayout` (index + `/:section`). */
export default function SettingsRoot() {
  return <Outlet />;
}
