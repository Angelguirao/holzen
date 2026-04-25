import { useContext } from 'react';
import { SettingsStateContext } from '@/pages/settings/settings-context';
import type { SettingsModel } from '@/pages/settings/useSettingsModel';

export function useSettingsState(): SettingsModel {
  const v = useContext(SettingsStateContext);
  if (!v) {
    throw new Error('useSettingsState must be used under SettingsStateProvider');
  }
  return v;
}
