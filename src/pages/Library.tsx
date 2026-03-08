import { lazy, Suspense } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '@/hooks/use-library';
import { PageMeta } from '@/components/PageMeta';
import { BookOpen, List, Share2 } from 'lucide-react';
import { LibraryItems } from '@/components/library/LibraryItems';
import { cn } from '@/lib/utils';

const GraphView = lazy(() => import('@/components/library/GraphView'));

export default function Library() {
  const { t } = useTranslation();
  const library = useLibrary();
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  return (
    <div className="space-y-5 pb-24">
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-foreground" />
          <h1 className="text-sm font-mono font-medium text-foreground">{t('library.title')}</h1>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border/40 p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1 rounded transition-colors',
              viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            )}
            aria-label="List view"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              'p-1 rounded transition-colors',
              viewMode === 'graph' ? 'bg-muted text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
            )}
            aria-label="Graph view"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <LibraryItems library={library} />
      ) : (
        <Suspense fallback={<div className="flex items-center justify-center h-[400px]"><p className="text-xs font-mono text-muted-foreground/40 animate-pulse">Loading graph…</p></div>}>
          <GraphView />
        </Suspense>
      )}
    </div>
  );
}
