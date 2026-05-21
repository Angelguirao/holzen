import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSignalSourcesCatalogQueryOptions } from '@/features/user/public-queries';
import {
  extractSignalSourceHost,
  resolveSignalSourceTrustedBadge,
} from '../../application/use-cases/ritual/frame/signal-source-trusted';

/** Signal full view — trusted-source badge from curated `signal_sources` catalog. */
export function useSignalSourceTrustedHost(signalUrl: string | null | undefined) {
  const host = extractSignalSourceHost(signalUrl);

  const { data: catalog = [], isPending, isError } = useQuery(
    getSignalSourcesCatalogQueryOptions(Boolean(host)),
  );

  const isTrusted = useMemo(
    () =>
      resolveSignalSourceTrustedBadge(host, catalog, {
        pending: isPending,
        error: isError,
      }),
    [host, catalog, isPending, isError],
  );

  return { host, isTrusted };
}
