import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ChevronDown, ChevronUp, Merge, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectDuplicates, type DuplicateGroup } from '@/lib/duplicate-detection';
import type { LibraryItem } from '@/hooks/use-library';

interface Props {
  items: LibraryItem[];
  onDeleteItem: (id: string) => Promise<void>;
  onSelectItem: (item: LibraryItem) => void;
}

export function DuplicateBanner({ items, onDeleteItem, onSelectItem }: Props) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);

  const groups = useMemo(() => detectDuplicates(items), [items]);

  const totalDupes = useMemo(
    () => groups.reduce((sum, g) => sum + g.duplicates.length, 0),
    [groups]
  );

  const handleMerge = useCallback(
    async (group: DuplicateGroup) => {
      setMerging(group.primary.id);
      // Keep the primary (oldest), delete the duplicates
      for (const dupe of group.duplicates) {
        await onDeleteItem(dupe.id);
      }
      setMerging(null);
    },
    [onDeleteItem]
  );

  if (groups.length === 0 || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded border border-primary/15 bg-primary/5 px-3 py-2 space-y-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Copy className="h-3.5 w-3.5 text-primary/60 shrink-0" />
        <p className="text-[10px] font-mono text-foreground/80 flex-1">
          {t('library.duplicatesFound', {
            count: totalDupes,
            defaultValue: '{{count}} possible duplicate(s) found',
          })}
        </p>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Expanded groups */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-3"
          >
            {groups.map((group) => (
              <div key={group.primary.id} className="space-y-1.5 pt-1 border-t border-border/20">
                {/* Primary */}
                <button
                  onClick={() => onSelectItem(group.primary)}
                  className="text-left w-full"
                >
                  <p className="text-[10px] font-mono text-foreground/70 line-clamp-2">
                    <span className="text-primary/50 mr-1">Original:</span>
                    {group.primary.body?.slice(0, 120)}
                  </p>
                </button>

                {/* Duplicates */}
                {group.duplicates.map((dupe) => (
                  <button
                    key={dupe.id}
                    onClick={() => onSelectItem(dupe)}
                    className="text-left w-full pl-3 border-l-2 border-destructive/20"
                  >
                    <p className="text-[10px] font-mono text-muted-foreground/60 line-clamp-2">
                      <span className="text-destructive/50 mr-1">≈ Duplicate:</span>
                      {dupe.body?.slice(0, 120)}
                    </p>
                  </button>
                ))}

                {/* Merge action */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground/30">
                    {Math.round(group.score * 100)}% similar
                  </span>
                  <button
                    onClick={() => handleMerge(group)}
                    disabled={merging === group.primary.id}
                    className={cn(
                      'flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors',
                      'border-primary/20 text-primary/70 hover:bg-primary/10',
                      merging === group.primary.id && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <Merge className="h-2.5 w-2.5" />
                    {merging === group.primary.id
                      ? t('common.loading', { defaultValue: 'Merging…' })
                      : t('library.mergeDuplicates', { defaultValue: 'Keep original, remove duplicates' })}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
