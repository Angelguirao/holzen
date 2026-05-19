/* Context + provider only; hook lives in use-settings-state.ts for react-refresh. */
import { createContext, type ReactNode } from 'react';
import type { SettingsModel } from '@/screens/settings/hooks/use-settings-model';

// eslint-disable-next-line react-refresh/only-export-components -- context module
export const SettingsStateContext = createContext<SettingsModel | null>(null);

export function SettingsStateProvider({ value, children }: { value: SettingsModel; children: ReactNode }) {
  return <SettingsStateContext.Provider value={value}>{children}</SettingsStateContext.Provider>;
}
