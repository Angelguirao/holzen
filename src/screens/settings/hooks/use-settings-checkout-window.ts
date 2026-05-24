import { useCallback, useState } from 'react';
import {
  getCheckoutSuppressionWindowMinutes,
  setCheckoutSuppressionWindowMinutes,
} from '@/features/subscription/public';

/** Dev/ops checkout suppression window (localStorage). */
export function useSettingsCheckoutWindow() {
  const [checkoutWindowMinutes, setCheckoutWindowMinutesState] = useState<number>(() =>
    getCheckoutSuppressionWindowMinutes(),
  );
  const [checkoutWindowDraft, setCheckoutWindowDraft] = useState<string>(() =>
    String(getCheckoutSuppressionWindowMinutes()),
  );

  const commitCheckoutWindow = useCallback(
    (raw: string) => {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        setCheckoutWindowDraft(String(checkoutWindowMinutes));
        return;
      }
      const stored = setCheckoutSuppressionWindowMinutes(parsed);
      setCheckoutWindowMinutesState(stored);
      setCheckoutWindowDraft(String(stored));
    },
    [checkoutWindowMinutes],
  );

  return {
    checkoutWindowMinutes,
    checkoutWindowDraft,
    setCheckoutWindowDraft,
    commitCheckoutWindow,
  };
}
