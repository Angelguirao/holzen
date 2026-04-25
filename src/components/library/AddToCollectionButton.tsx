import { useState } from 'react';
import { FolderPlus, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Collection } from '@/hooks/use-library';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Props {
  itemId: string;
  collections: Collection[];
  itemCollections: Collection[];
  onAdd: (collectionId: string, itemId: string) => Promise<void>;
  onRemove: (collectionId: string, itemId: string) => Promise<void>;
}

export function AddToCollectionButton({ itemId, collections, itemCollections, onAdd, onRemove }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (collections.length === 0) return null;

  const isInCollection = (colId: string) => itemCollections.some((c) => c.id === colId);

  const toggle = async (colId: string) => {
    if (isInCollection(colId)) {
      await onRemove(colId, itemId);
    } else {
      await onAdd(colId, itemId);
      toast.success(t('library.addedToCollection'));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Add to collection"
        >
          <FolderPlus className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="end">
        <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider px-2 py-1">
          {t('library.addToCollection')}
        </p>
        {collections.map((col) => (
          <button
            key={col.id}
            onClick={() => toggle(col.id)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-muted transition-colors"
          >
            <span className="text-xs">{col.icon ?? '📂'}</span>
            <span className="text-[11px] font-mono text-foreground flex-1 truncate">{col.name}</span>
            {isInCollection(col.id) && <Check className="h-3 w-3 text-primary shrink-0" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
