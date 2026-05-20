import { useRef, useEffect } from 'react';

/** Keeps a ref aligned with the latest render value (stable callbacks reading “current”). */
export function useLatestRef<T>(value: T) {
  const r = useRef(value);
  useEffect(() => {
    r.current = value;
  }, [value]);
  return r;
}
