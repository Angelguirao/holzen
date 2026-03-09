import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '@/hooks/use-library';
import { PageMeta } from '@/components/PageMeta';
import { Star, Search, Tag, FolderOpen, Filter, X, Lock } from 'lucide-react';
import { LibraryItems } from '@/components/library/LibraryItems';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProGate } from '@/hooks/use-pro-gate';

const SOURCE_FILTERS: { key: string; label: string }[] = [
  { key: 'reflection', label: 'Reflection' },
  { key: 'signal', label: 'Signal' },
  { key: 'learning', label: 'Learning' },
  { key: 'haiku', label: 'Haiku' },
  { key: 'zoom_out', label: 'Zoom Out' },
  { key: 'history_insight', label: 'History' },
  { key: 'reflection_note', label: 'Note' },
  { key: 'external', label: 'External' },
];

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'archived', label: 'Archived' },
];

export default function Library() {
  const { t } = useTranslation();
  const { isPro, startCheckout, checkoutLoading } = useProGate();
  const library = useLibrary();
  const [tab, setTab] = useState<'all' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { items, collections, collectionItems } = library;

  // Derived data for filter chips
  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const availableSources = useMemo(() => {
    const existing = new Set(items.map((i) => i.source_type).filter(Boolean));
    return SOURCE_FILTERS.filter((f) => existing.has(f.key));
  }, [items]);

  // Filtering
  const filtered = useMemo(() => {
    let result = items;
    // Tab
    if (tab === 'favorites') result = result.filter((i) => i.pinned);
    // Status filter (default: hide archived)
    if (statusFilter) {
      result = result.filter((i) => i.status === statusFilter);
    } else if (!search.trim()) {
      result = result.filter((i) => i.status !== 'archived');
    }
    // Source type
    if (sourceFilter) result = result.filter((i) => i.source_type === sourceFilter);
    // Tag
    if (tagFilter) result = result.filter((i) => i.tags?.includes(tagFilter));
    // Collection
    if (collectionFilter) {
      const itemIds = new Set(
        collectionItems
          .filter((ci) => ci.collection_id === collectionFilter)
          .map((ci) => ci.library_item_id)
      );
      result = result.filter((i) => itemIds.has(i.id));
    }
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
  }, [items, tab, sourceFilter, statusFilter, tagFilter, collectionFilter, collectionItems, search]);

  const hasActiveFilters = !!sourceFilter || !!statusFilter || !!tagFilter || !!collectionFilter;

  const clearFilters = () => {
    setSourceFilter(null);
    setStatusFilter(null);
    setTagFilter(null);
    setCollectionFilter(null);
  };

  if (!isPro) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
          <Lock className="h-6 w-6 text-muted-foreground/30" />
          <h2 className="text-sm font-mono text-foreground">{t('pro.featureLocked')}</h2>
          <p className="text-xs text-muted-foreground max-w-xs">{t('pro.upgradeDesc')}</p>
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

  return (
    <div className="space-y-6 pb-24">
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      {/* Tab header — matches Profile pattern */}
      <div className="flex items-center gap-5 overflow-x-auto">
        <button
          onClick={() => setTab('all')}
          className={`text-sm font-mono tracking-widest uppercase transition-colors whitespace-nowrap ${
            tab === 'all' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
          }`}
        >
          {t('library.tabAll')}
        </button>
        <button
          onClick={() => setTab('favorites')}
          className={`text-sm font-mono tracking-widest uppercase transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            tab === 'favorites' ? 'text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground'
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          {t('library.tabFavorites')}
        </button>

      </div>

      <div className="space-y-3">
          {/* Search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('library.searchPlaceholder')}
                className="pl-8 h-8 text-xs font-mono"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-1.5 rounded border transition-colors',
                showFilters || hasActiveFilters
                  ? 'border-foreground/20 bg-foreground/5 text-foreground'
                  : 'border-border/40 text-muted-foreground/40 hover:text-muted-foreground'
              )}
              aria-label="Toggle filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="space-y-2.5 rounded-md border border-border/40 bg-card/30 p-3">
              {/* Source type */}
              {availableSources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Type</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {availableSources.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
                        className={cn(
                          'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors',
                          sourceFilter === key
                            ? 'border-foreground/20 bg-foreground/5 text-foreground'
                            : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1">
                <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STATUS_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                      className={cn(
                        'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors',
                        statusFilter === key
                          ? 'border-foreground/20 bg-foreground/5 text-foreground'
                          : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Tag</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                        className={cn(
                          'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors',
                          tagFilter === tag
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Collections */}
              {collections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Collection</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setCollectionFilter(collectionFilter === col.id ? null : col.id)}
                        className={cn(
                          'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1',
                          collectionFilter === col.id
                            ? 'border-foreground/20 bg-foreground/5 text-foreground'
                            : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
                        )}
                      >
                        {col.icon && <span>{col.icon}</span>}
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-[9px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-1"
                >
                  <X className="h-2.5 w-2.5" /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Active filter pills (visible when panel is closed) */}
          {!showFilters && hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {sourceFilter && (
                <button onClick={() => setSourceFilter(null)} className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-foreground/20 bg-foreground/5 text-foreground flex items-center gap-1">
                  {SOURCE_FILTERS.find((f) => f.key === sourceFilter)?.label ?? sourceFilter}
                  <X className="h-2 w-2" />
                </button>
              )}
              {statusFilter && (
                <button onClick={() => setStatusFilter(null)} className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-foreground/20 bg-foreground/5 text-foreground flex items-center gap-1">
                  {statusFilter}
                  <X className="h-2 w-2" />
                </button>
              )}
              {tagFilter && (
                <button onClick={() => setTagFilter(null)} className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center gap-1">
                  {tagFilter}
                  <X className="h-2 w-2" />
                </button>
              )}
              {collectionFilter && (
                <button onClick={() => setCollectionFilter(null)} className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-foreground/20 bg-foreground/5 text-foreground flex items-center gap-1">
                  {collections.find((c) => c.id === collectionFilter)?.name}
                  <X className="h-2 w-2" />
                </button>
              )}
            </div>
          )}

          {/* Count */}
          <div className="flex items-center justify-end">
            <span className="text-[9px] font-mono text-muted-foreground/30">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Item list */}
          <LibraryItems library={library} filtered={filtered} />
        </div>
    </div>
  );
}
