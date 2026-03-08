import { useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '@/hooks/use-library';
import { PageMeta } from '@/components/PageMeta';
import { BookOpen, Clock, Bookmark, FolderOpen, Share2 } from 'lucide-react';
import { LibraryItems } from '@/components/library/LibraryItems';
import { LibraryCollections } from '@/components/library/LibraryCollections';
import { cn } from '@/lib/utils';

// Lazy-load heavy content
import HistoryContent from '@/components/library/HistoryContent';
const GraphView = lazy(() => import('@/components/library/GraphView'));

const TABS = [
  { key: 'activity', icon: Clock, labelKey: 'library.tabActivity' },
  { key: 'items', icon: Bookmark, labelKey: 'library.tabItems' },
  { key: 'collections', icon: FolderOpen, labelKey: 'library.tabCollections' },
  { key: 'graph', icon: Share2, labelKey: 'library.tabGraph' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function Library() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabKey>('activity');
  const library = useLibrary();

  return (
    <div className="space-y-5 pb-24">
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-foreground" />
        <h1 className="text-sm font-mono font-medium text-foreground">{t('library.title')}</h1>
      </div>

      {/* Top-level tabs */}
      <div className="flex items-center gap-1 border-b border-border/40">
        {TABS.map(({ key, icon: Icon, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px',
              tab === key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
            )}
          >
            <Icon className="h-3 w-3" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'activity' && <HistoryContent />}
      {tab === 'items' && <LibraryItems library={library} />}
      {tab === 'collections' && <LibraryCollections library={library} />}
      {tab === 'graph' && (
        <Suspense fallback={<div className="flex items-center justify-center h-[400px]"><p className="text-xs font-mono text-muted-foreground/40 animate-pulse">Loading graph…</p></div>}>
          <GraphView />
        </Suspense>
      )}
    </div>
  );
}
