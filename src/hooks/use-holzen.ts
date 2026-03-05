import { useState, useEffect, useCallback } from 'react';
import { fetchBtcData, type BtcPriceData } from '@/lib/btc';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY_THRESHOLD = 'holzen_threshold';
const STORAGE_KEY_COOLDOWN = 'holzen_last_trigger';
const STORAGE_KEY_MESSAGE = 'holzen_last_message';
const STORAGE_KEY_CONTEXT = 'holzen_last_context';
const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

export function useHolzen() {
  const [threshold, setThresholdState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_THRESHOLD);
    return stored ? parseFloat(stored) : 5;
  });
  const [btcData, setBtcData] = useState<BtcPriceData | null>(null);
  const [message, setMessage] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_MESSAGE)
  );
  const [context, setContext] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY_CONTEXT)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setThreshold = useCallback((val: number) => {
    setThresholdState(val);
    localStorage.setItem(STORAGE_KEY_THRESHOLD, val.toString());
  }, []);

  const isInCooldown = useCallback(() => {
    const last = localStorage.getItem(STORAGE_KEY_COOLDOWN);
    if (!last) return false;
    return Date.now() - parseInt(last) < COOLDOWN_MS;
  }, []);

  const generateMessage = useCallback(async (data: BtcPriceData) => {
    const dir = data.direction === 'down' ? 'down' : 'up';
    const pct = Math.abs(data.changePercent).toFixed(1);
    const ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;

    setLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('holzen-reflect', {
        body: { context: ctx },
      });

      if (fnError) throw fnError;

      const msg = fnData?.message;
      if (msg) {
        setMessage(msg);
        setContext(ctx);
        localStorage.setItem(STORAGE_KEY_MESSAGE, msg);
        localStorage.setItem(STORAGE_KEY_CONTEXT, ctx);
        localStorage.setItem(STORAGE_KEY_COOLDOWN, Date.now().toString());
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate message');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAndTrigger = useCallback(async () => {
    try {
      const data = await fetchBtcData();
      setBtcData(data);

      if (Math.abs(data.changePercent) >= threshold && !isInCooldown()) {
        await generateMessage(data);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch BTC data');
    }
  }, [threshold, isInCooldown, generateMessage]);

  const dismissMessage = useCallback(() => {
    setMessage(null);
    setContext(null);
    localStorage.removeItem(STORAGE_KEY_MESSAGE);
    localStorage.removeItem(STORAGE_KEY_CONTEXT);
  }, []);

  // Initial fetch and periodic check every 5 minutes
  useEffect(() => {
    checkAndTrigger();
    const interval = setInterval(checkAndTrigger, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndTrigger]);

  return {
    threshold,
    setThreshold,
    btcData,
    message,
    context,
    loading,
    error,
    dismissMessage,
  };
}
