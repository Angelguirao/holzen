import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, ExternalLink, Tag, Link2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { LibraryItem } from '@/hooks/use-library';

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

const TYPE_EMOJIS: Record<string, string> = {
  bookmark: '🔖',
  note: '📝',
  clipping: '✂️',
};

interface Props {
  item: LibraryItem | null;
  linkedItems?: LibraryItem[];
  allItems?: LibraryItem[];
  open: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onSelectItem?: (item: LibraryItem) => void;
}

function CompanionCard({ item, onSelect }: { item: LibraryItem; onSelect?: (item: LibraryItem) => void }) {
  const sourceLabel = SOURCE_LABELS[item.source_type ?? ''] ?? item.source_type ?? 'Item';

  // Try to parse zoom_out JSON for richer display
  const zoomOutData = useMemo(() => {
    if (item.source_type !== 'zoom_out' || !item.body) return null;
    try { return JSON.parse(item.body); } catch { return null; }
  }, [item.source_type, item.body]);

  return (
    <button
      onClick={() => onSelect?.(item)}
      className="w-full text-left rounded-md border border-border/40 bg-card/30 px-3 py-2.5 space-y-1.5 hover:bg-card/60 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{sourceLabel}</span>
        {item.is_favorite && <Heart className="h-2.5 w-2.5 text-destructive fill-current" />}
      </div>
      {item.title && item.title !== 'Reflection' && (
        <p className="text-xs font-medium text-foreground leading-snug">{item.title}</p>
      )}
      {item.source_type === 'haiku' && item.body && (
        <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line italic">{item.body}</p>
      )}
      {item.source_type === 'zoom_out' && zoomOutData && (
        <div className="space-y-1">
          {zoomOutData.onThisDay?.length > 0 && (
            <p className="text-[10px] font-mono text-muted-foreground/50">
              {zoomOutData.onThisDay.length} historical data points
            </p>
          )}
          {zoomOutData.echo?.message && (
            <p className="text-[11px] text-muted-foreground/70 italic line-clamp-2">"{zoomOutData.echo.message}"</p>
          )}
          {zoomOutData.deepTime && (
            <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{zoomOutData.deepTime}</p>
          )}
        </div>
      )}
      {item.source_type === 'history_insight' && item.body && (
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3">{item.body}</p>
      )}
      {item.source_type === 'signal' && (
        <div className="space-y-1">
          {item.body && <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3">{item.body}</p>}
          {item.source_url && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-primary/60">
              <ExternalLink className="h-2 w-2" /> source
            </span>
          )}
        </div>
      )}
      {item.source_type === 'learning' && (
        <div className="space-y-1">
          {item.body && <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3">{item.body}</p>}
          {item.source_url && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-primary/60">
              <ExternalLink className="h-2 w-2" /> source
            </span>
          )}
        </div>
      )}
      {/* Fallback for other types */}
      {!['haiku', 'zoom_out', 'history_insight', 'signal', 'learning', 'reflection'].includes(item.source_type ?? '') && item.body && (
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-3">{item.body}</p>
      )}
    </button>
  );
}

export function ItemDetailViewer({ item, linkedItems, allItems, open, onClose, onToggleFavorite, onSelectItem }: Props) {
  // For non-reflection items, find siblings (other items with same reflection_id)
  const siblings = useMemo(() => {
    if (!item?.reflection_id || !allItems) return [];
    return allItems.filter((i) => i.reflection_id === item.reflection_id && i.id !== item.id);
  }, [item, allItems]);

  // Parse zoom_out JSON
  const zoomOutData = useMemo(() => {
    if (item?.source_type !== 'zoom_out' || !item?.body) return null;
    try { return JSON.parse(item.body); } catch { return null; }
  }, [item?.source_type, item?.body]);

  if (!item) return null;

  const companions = linkedItems && linkedItems.length > 0 ? linkedItems : siblings;
  const isReflection = item.source_type === 'reflection';
  const sourceLabel = SOURCE_LABELS[item.source_type ?? ''] ?? item.source_type ?? 'Item';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{TYPE_EMOJIS[item.type] ?? '📄'}</span>
              <SheetTitle className="text-sm font-mono">
                {isReflection ? 'Reflection' : sourceLabel}
              </SheetTitle>
            </div>
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-1.5 transition-colors ${item.is_favorite ? 'text-destructive' : 'text-muted-foreground/40 hover:text-destructive'}`}
            >
              <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Metadata */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono text-muted-foreground/50 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}
            </span>
            {item.source_type && !isReflection && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground">
                {sourceLabel}
              </span>
            )}
          </div>

          {/* Title */}
          {item.title && !(isReflection && item.title === 'Reflection') && (
            <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
          )}

          {/* Body — full content */}
          {item.source_type === 'haiku' && item.body ? (
            <div className="py-4 px-2">
              <p className="text-base text-foreground/80 leading-loose whitespace-pre-line italic text-center">{item.body}</p>
            </div>
          ) : item.source_type === 'zoom_out' && zoomOutData ? (
            <div className="space-y-3">
              {zoomOutData.onThisDay?.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">On this day</p>
                  {[...zoomOutData.onThisDay].reverse().map((entry: any) => (
                    <div key={entry.yearsAgo} className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-muted-foreground/60 w-14 shrink-0">{entry.yearsAgo}y ago</span>
                      <span className="text-muted-foreground tabular-nums">${entry.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {zoomOutData.echo?.message && (
                <div className="space-y-1 border-l-2 border-border/40 pl-3">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Echo</p>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{zoomOutData.echo.message}"</p>
                </div>
              )}
              {zoomOutData.deepTime && (
                <div className="space-y-1">
                  <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">Deep Time</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{zoomOutData.deepTime}</p>
                </div>
              )}
            </div>
          ) : item.body ? (
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{item.body}</p>
          ) : null}

          {/* Source URL */}
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View source
            </a>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/70">
                  <Tag className="h-2 w-2" />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Linked companions */}
          {companions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-3 w-3 text-muted-foreground/40" />
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  {isReflection ? 'Companions' : 'Related items'}
                </p>
              </div>
              <div className="space-y-1.5">
                {companions.map((li) => (
                  <CompanionCard key={li.id} item={li} onSelect={onSelectItem} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
