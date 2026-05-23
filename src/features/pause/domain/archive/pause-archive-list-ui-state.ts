import type { InfiniteData } from '@tanstack/react-query';

export function buildPauseArchiveInfiniteInitialData<TRow>(
  cached: TRow[] | null,
  pageSize: number,
): InfiniteData<TRow[], number> | undefined {
  if (!cached?.length) return undefined;
  const page0 = cached.length > pageSize ? cached.slice(0, pageSize) : cached;
  return { pages: [page0], pageParams: [0] };
}

/** Spinner when query is active, no error, empty rows, and still fetching. */
export function isPauseArchiveListInitialLoading(opts: {
  queryEnabled: boolean;
  isError: boolean;
  rowCount: number;
  isPending: boolean;
  isFetching: boolean;
}): boolean {
  return opts.queryEnabled && !opts.isError && opts.rowCount === 0 && (opts.isPending || opts.isFetching);
}
