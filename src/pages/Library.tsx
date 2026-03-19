import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '@/hooks/use-library';
import { PageMeta } from '@/components/PageMeta';
import { Heart, Search, X, Lock } from 'lucide-react';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { LibraryItems } from '@/components/library/LibraryItems';
import { LibraryCollections } from '@/components/library/LibraryCollections';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProGate } from '@/hooks/use-pro-gate';

const SOURCE_CHIPS: { key: string; emoji: string; label: string }[] = [
  { key: 'reflection', emoji: '⏸', label: 'Pause' },
  { key: 'signal', emoji: '📡', label: 'Signal' },
  { key: 'learning', emoji: '📖', label: 'Learning' },
  { key: 'haiku', emoji: '🍃', label: 'Haiku' },
  { key: 'zoom_out', emoji: '🔭', label: 'Zoom Out' },
  { key: 'history_insight', emoji: '📜', label: 'History' },
  { key: 'reflection_note', emoji: '✏️', label: 'Note' },
  { key: 'external', emoji: '🔗', label: 'External' },
];


type Tab = 'all' | 'favorites' | 'collections';

export default function Library() {
  const { t } = useTranslation();
  const { isPro, isPending, startCheckout, checkoutLoading } = useProGate();
  const library = useLibrary();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>('reflection');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { items, collections } = library;

  // Available source types from actual data
  const availableSources = useMemo(() => {
    const existing = new Set(items.map((i) => i.source_type).filter(Boolean));
    return SOURCE_CHIPS.filter((f) => existing.has(f.key));
  }, [items]);

  // Available tags from actual data (sorted by frequency)
  const availableTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    items.forEach((i) => {
      i.tags?.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [items]);

  const hasActiveFilters = !!sourceFilter || !!statusFilter || !!tagFilter;

  // Filtering
  const filtered = useMemo(() => {
    let result = items;
    // Tab
    if (tab === 'favorites') result = result.filter((i) => i.is_favorite);
    // Always hide deleted
    result = result.filter((i) => i.status !== 'deleted');
    // Status filter
    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    } else if (!search.trim()) {
      // Hide archived by default when no status filter active
      result = result.filter((i) => i.status !== 'archived');
    }
    // Source type
    if (sourceFilter) result = result.filter((i) => i.source_type === sourceFilter);
    // Tag
    if (tagFilter) result = result.filter((i) => i.tags?.includes(tagFilter));
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.body?.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.includes(q))
      );
    }
    return result;
  }, [items, tab, sourceFilter, statusFilter, tagFilter, search]);

  if (isPending) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <SubscriptionSkeleton variant="inline" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
          <Lock className="h-6 w-6 text-muted-foreground/30" />
          <h2 className="text-sm font-mono text-foreground">{t('pro.featureLocked')}</h2>
          <p className="text-xs text-muted-foreground max-w-xs">{t('pro.desc_library')}</p>
          <button
            onClick={startCheckout}
            disabled={checkoutLoading}
            className="text-xs font-mono text-primary hover:text-primary/80 underline transition-colors"
          >
            {t('pro.upgradeCta')}
          </button>
        </div>
      </div>
    );
  }

  const clearAllFilters = () => {
    setSourceFilter(null);
    setStatusFilter(null);
    setTagFilter(null);
  };

  return (
    <div className="space-y-4 pb-24">
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border/30 overflow-x-auto">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'text-xs font-mono tracking-wide px-3 py-2 transition-colors whitespace-nowrap border-b-2',
            tab === 'all'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          {t('library.tabAll')}
        </button>
        <button
          onClick={() => setTab('favorites')}
          className={cn(
            'text-xs font-mono tracking-wide px-3 py-2 transition-colors whitespace-nowrap border-b-2 flex items-center gap-1.5',
            tab === 'favorites'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          <Heart className="h-3 w-3" />
          {t('library.tabFavorites')}
        </button>
        <button
          onClick={() => setTab('collections')}
          className={cn(
            'text-xs font-mono tracking-wide px-3 py-2 transition-colors whitespace-nowrap border-b-2',
            tab === 'collections'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          {t('library.tabCollections')}
          {collections.length > 0 && (
            <span className="ml-1.5 text-[9px] text-muted-foreground/40">{collections.length}</span>
          )}
        </button>
      </div>

      {/* Collections tab */}
      {tab === 'collections' && (
        <LibraryCollections library={library} />
      )}

      {/* All / Favorites tabs */}
      {tab !== 'collections' && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
              className="pl-8 h-8 text-xs font-mono border-border/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Source type chips */}
          {availableSources.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
              {availableSources.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
                  className={cn(
                    'text-[10px] font-mono px-2 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1',
                    sourceFilter === key
                      ? 'border-foreground/20 bg-foreground/5 text-foreground'
                      : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70'
                  )}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Status chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
            {STATUS_CHIPS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                className={cn(
                  'text-[10px] font-mono px-2 py-1 rounded-full border transition-colors whitespace-nowrap',
                  statusFilter === key
                    ? 'border-foreground/20 bg-foreground/5 text-foreground'
                    : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70'
                )}
              >
                {t(`library.${label}`)}
              </button>
            ))}
          </div>

          {/* Tag chips */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
              {availableTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={cn(
                    'text-[10px] font-mono px-2 py-1 rounded-full border transition-colors whitespace-nowrap',
                    tagFilter === tag
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Active filter clear-all */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <X className="h-2.5 w-2.5" /> {t('library.clearAll')}
            </button>
          )}

          {/* Count */}
          <div className="px-1">
            <span className="text-[9px] font-mono text-muted-foreground/30">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Item list with date grouping */}
          <LibraryItems library={library} filtered={filtered} />
        </div>
      )}
    </div>
  );
}