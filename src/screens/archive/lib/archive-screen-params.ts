import type { ArchiveMainSegment } from '@/features/pause/public-hooks';

export function readArchiveMainSegment(params: URLSearchParams): ArchiveMainSegment {
  const s = params.get('seg');
  if (s === 'echoes') return s;
  return 'pauses';
}

export function readArchivePausesScope(params: URLSearchParams): 'all' | 'favorites' {
  return params.get('scope') === 'favs' ? 'favorites' : 'all';
}
