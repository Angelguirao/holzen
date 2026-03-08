import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLibrary } from '@/hooks/use-library';
import { LibraryItemCard } from '@/components/library/LibraryItemCard';
import { NewNoteForm } from '@/components/library/NewNoteForm';
import { CollectionCard } from '@/components/library/CollectionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, Bookmark, StickyNote, FolderOpen } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

export default function Library() {
  const { t } = useTranslation();
  const { items, collections, loading, addItem, updateItem, deleteItem, togglePin, deleteCollection } = useLibrary();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filtered = useMemo(() => {
    let result = items;
    if (tab === 'bookmarks') result = result.filter((i) => i.type === 'bookmark');
    if (tab === 'notes') result = result.filter((i) => i.type === 'note');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.body?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
      );
    }
    return result;
  }, [items, tab, search]);

  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedItems = filtered.filter((i) => !i.pinned);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status } as any);
  };

  const handleNewNote = async (title: string, body: string, tags: string[]) => {
    await addItem({ type: 'note', title: title || null, body, tags });
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-foreground" />
          <h1 className="text-sm font-mono font-medium text-foreground">{t('library.title')}</h1>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {t('library.itemCount', { count: items.length })}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          className="pl-8 h-8 text-xs font-mono"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-4 h-8">
          <TabsTrigger value="all" className="text-[10px] font-mono gap-1">
            <BookOpen className="h-3 w-3" />{t('library.tabAll')}
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="text-[10px] font-mono gap-1">
            <Bookmark className="h-3 w-3" />{t('library.tabBookmarks')}
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-[10px] font-mono gap-1">
            <StickyNote className="h-3 w-3" />{t('library.tabNotes')}
          </TabsTrigger>
          <TabsTrigger value="collections" className="text-[10px] font-mono gap-1">
            <FolderOpen className="h-3 w-3" />{t('library.tabCollections')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-3 space-y-4">
          <NewNoteForm onSave={handleNewNote} />
          {pinnedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('common.pinned')}</p>
              {pinnedItems.map((item) => (
                <LibraryItemCard key={item.id} item={item} onTogglePin={togglePin} onDelete={deleteItem} />
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            {unpinnedItems.map((item) => (
              <LibraryItemCard key={item.id} item={item} onTogglePin={togglePin} onDelete={deleteItem} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
              {search ? t('library.noResults') : t('library.emptyState')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-3 space-y-1.5">
          {filtered.map((item) => (
            <LibraryItemCard key={item.id} item={item} onTogglePin={togglePin} onDelete={deleteItem} />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
              {t('library.noBookmarks')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-3 space-y-3">
          <NewNoteForm onSave={handleNewNote} />
          <div className="space-y-1.5">
            {filtered.map((item) => (
              <LibraryItemCard key={item.id} item={item} onTogglePin={togglePin} onDelete={deleteItem} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
              {t('library.noNotes')}
            </p>
          )}
        </TabsContent>

        <TabsContent value="collections" className="mt-3 space-y-2">
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              itemCount={0}
              onDelete={deleteCollection}
              onSelect={() => {}}
            />
          ))}
          {collections.length === 0 && (
            <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
              {t('library.noCollections')}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
