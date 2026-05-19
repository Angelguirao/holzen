import { useContext } from 'react';
import { SettingsStateContext } from '@/screens/settings/settings-context';
import type { SettingsModel } from '@/screens/settings/hooks/use-settings-model';

export function useSettingsState(): SettingsModel {
  const v = useContext(SettingsStateContext);
  if (!v) {
    throw new Error('useSettingsState must be used under SettingsStateProvider');
  }
  return v;
}
