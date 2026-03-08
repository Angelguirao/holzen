import { useState, useRef, useEffect, useCallback } from 'react';
import { Pin, PinOff, Trash2, ExternalLink, Tag, X, Eye, EyeOff, Archive, FolderPlus, Link2, Heart } from 'lucide-react';
import type { LibraryItem, Collection } from '@/hooks/use-library';
import { useTranslation } from 'react-i18next';
import { AddToCollectionButton } from './AddToCollectionButton';

const SOURCE_LABELS: Record<string, string> = {
  reflection: 'Reflection',
  reflection_note: 'Note',
  signal: 'Signal',
  learning: 'Learning',
  haiku: 'Haiku',
  zoom_out: 'Zoom Out',
  history_insight: 'History',
  external: 'External',
};

const TYPE_LABELS: Record<string, string> = {
  bookmark: '🔖',
  note: '📝',
  clipping: '✂️',
};

interface Props {
  item: LibraryItem;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'unread' | 'read' | 'archived') => void;
  onUpdateTags?: (id: string, tags: string[]) => void;
  linkedItems?: LibraryItem[];
  collections?: Collection[];
  itemCollections?: Collection[];
  onAddToCollection?: (collectionId: string, itemId: string) => Promise<any>;
  onRemoveFromCollection?: (collectionId: string, itemId: string) => Promise<void>;
  onClick?: () => void;
}

export function LibraryItemCard({
  item, onTogglePin, onToggleFavorite, onDelete, onStatusChange, onUpdateTags, linkedItems,
  collections, itemCollections, onAddToCollection, onRemoveFromCollection, onClick,
}: Props) {
  const { t } = useTranslation();
  const isUnread = item.status === 'unread';
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTags) tagInputRef.current?.focus();
  }, [editingTags]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || item.tags.includes(trimmed) || !onUpdateTags) return;
    onUpdateTags(item.id, [...item.tags, trimmed]);
    setTagInput('');
  }, [item.id, item.tags, onUpdateTags]);

  const removeTag = useCallback((tag: string) => {
    if (!onUpdateTags) return;
    onUpdateTags(item.id, item.tags.filter((t) => t !== tag));
  }, [item.id, item.tags, onUpdateTags]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Escape') {
      setEditingTags(false);
      setTagInput('');
    }
  };

  return (
    <div className="group rounded-md border border-border/40 bg-card/50 px-3 py-2.5 space-y-1.5 transition-colors hover:bg-card/80">
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{TYPE_LABELS[item.type] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          {item.title && (
            <p className="text-xs font-medium text-foreground leading-snug truncate">{item.title}</p>
          )}
          {item.body && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mt-0.5">
              {item.body}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onToggleFavorite(item.id)}
            className={`p-1 transition-colors ${item.is_favorite ? 'text-destructive' : 'text-muted-foreground/50 hover:text-destructive'}`}
            aria-label={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-3 w-3 ${item.is_favorite ? 'fill-current' : ''}`} />
          </button>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStatusChange(item.id, isUnread ? 'read' : 'unread')}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label={isUnread ? 'Mark read' : 'Mark unread'}
          >
            {isUnread ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onStatusChange(item.id, 'archived')}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label="Archive"
          >
            <Archive className="h-3 w-3" />
          </button>
          {collections && itemCollections && onAddToCollection && onRemoveFromCollection && (
            <AddToCollectionButton
              itemId={item.id}
              collections={collections}
              itemCollections={itemCollections}
              onAdd={onAddToCollection}
              onRemove={onRemoveFromCollection}
            />
          )}
          <button
            onClick={() => onTogglePin(item.id)}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label={item.pinned ? t('common.unpin') : t('common.pinned')}
          >
            {item.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {isUnread && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/15 text-primary">
            unread
          </span>
        )}
        {item.status === 'archived' && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground/50">
            archived
          </span>
        )}
        {item.pinned && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary">
            pinned
          </span>
        )}
        {item.source_type && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground">
            {SOURCE_LABELS[item.source_type] ?? item.source_type}
          </span>
        )}
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            link
          </a>
        )}
        {itemCollections && itemCollections.length > 0 && itemCollections.map((col) => (
          <span key={col.id} className="text-[9px] font-mono px-1 py-0.5 rounded bg-accent/50 text-accent-foreground/70">
            {col.icon ?? '📂'} {col.name}
          </span>
        ))}
        {item.tags.length > 0 && item.tags.map((tag) => (
          editingTags ? (
            <button
              key={tag}
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Tag className="h-2 w-2" />{tag}
              <X className="h-2 w-2 text-primary/50 ml-0.5" />
            </button>
          ) : (
            <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.5 rounded bg-primary/5 text-primary/70">
              <Tag className="h-2 w-2" />{tag}
            </span>
          )
        ))}
        {onUpdateTags && (
          <button
            onClick={() => setEditingTags(!editingTags)}
            className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <Tag className="h-2.5 w-2.5" />
            {item.tags.length === 0 && !editingTags ? 'tag' : editingTags ? 'done' : '+'}
          </button>
        )}
      </div>

      {editingTags && (
        <div className="px-3 pb-2">
          <input
            ref={tagInputRef}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag + Enter…"
            className="w-full text-[10px] font-mono px-2 py-1 rounded border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      )}

      {/* Linked companions */}
      {linkedItems && linkedItems.length > 0 && (
        <div className="px-3 pb-2 flex items-center gap-1.5 flex-wrap">
          <Link2 className="h-2.5 w-2.5 text-muted-foreground/30" />
          {linkedItems.map((li) => (
            <span
              key={li.id}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60"
            >
              {SOURCE_LABELS[li.source_type ?? ''] ?? li.source_type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
