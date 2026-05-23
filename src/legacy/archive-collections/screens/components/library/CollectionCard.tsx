import { Trash2, FolderOpen } from 'lucide-react';
import type { Collection } from '@/legacy/archive-collections/domain/library-bundle';

interface Props {
  collection: Collection;
  itemCount: number;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function CollectionCard({ collection, itemCount, onDelete, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(collection.id)}
      className="group w-full text-left rounded-md border border-border/40 bg-card/50 px-3 py-2.5 hover:bg-card/80 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{collection.icon ?? '📂'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{collection.name}</p>
          {collection.description && (
            <p className="text-[10px] text-muted-foreground/60 truncate">{collection.description}</p>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/40">{itemCount}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(collection.id); }}
          className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-destructive transition-all"
          aria-label="Delete collection"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </button>
  );
}
