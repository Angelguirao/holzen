import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Persist `?ref=` from landing/welcome URLs for post-sign-in attribution. */
export function useCaptureReferralFromUrl(): void {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('holzen_ref', ref);
  }, [searchParams]);
}
