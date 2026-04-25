import { useMemo, useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Heart, ExternalLink, Tag, Link2, Clock, Pin, PinOff, Trash2, Archive, X, FolderPlus, Check, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import type { LibraryItem, Collection, CollectionItem } from '@/hooks/use-library';
import { supabase } from '@/integrations/supabase/client';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { CompanionFeedback } from '@/components/CompanionFeedback';
import { librarySourceLabel } from '@/lib/library-source-label';

const TYPE_EMOJIS: Record<string, string> = {
  bookmark: '🔖',
  note: '📝',
  clipping: '✂️',
};

const SOURCE_EMOJIS: Record<string, string> = {
  reflection: '⏸',
  signal: '📡',
  grounding: '🌿',
  learning: '🌿',
  haiku: '🍃',
  zoom_out: '🔭',
  history_insight: '📜',
  reflection_note: '✏️',
  external: '🔗',
  ground: '🌿',
  practice: '🧘',
};

const OUTCOME_OPTIONS = [
  { key: 'held', labelKey: 'ritual.decide.hold' },
  { key: 'sold', labelKey: 'ritual.decide.sell' },
  { key: 'bought', labelKey: 'ritual.decide.buy' },
] as const;

type ZoomOutOnThisDayEntry = { yearsAgo: number; price?: number; date?: string };
type ZoomOutParsedBody = {
  onThisDay?: ZoomOutOnThisDayEntry[];
  echo?: { message?: string };
  deepTime?: string | { title?: string; body?: string };
};

interface Props {
  item: LibraryItem | null;
  linkedItems?: LibraryItem[];
  allItems?: LibraryItem[];
  open: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'unread' | 'read' | 'archived') => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  onSelectItem?: (item: LibraryItem) => void;
  collections?: Collection[];
  getItemCollections?: (itemId: string) => Collection[];
  onAddToCollection?: (collectionId: string, itemId: string) => Promise<CollectionItem | null>;
  onRemoveFromCollection?: (collectionId: string, itemId: string) => Promise<void>;
  isIncomplete?: boolean;
  onOutcomeRecorded?: () => void;
  currentOutcome?: string | null;
}

function CompanionCard({ item, onSelect }: { item: LibraryItem; onSelect?: (item: LibraryItem) => void }) {
  const { t } = useTranslation();
  const sourceLabel = librarySourceLabel(item.source_type, t, item.source_type ?? 'Item');
  const bodyText = typeof item.body === 'string' ? item.body : item.body ? JSON.stringify(item.body) : null;

  return (
    <button
      onClick={() => onSelect?.(item)}
      className="w-full text-left rounded-md border border-border/40 bg-card/30 px-3 py-2.5 space-y-1 hover:bg-card/60 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
          {SOURCE_EMOJIS[item.source_type ?? ''] ?? '📄'} {sourceLabel}
        </span>
        {item.is_favorite && <Heart className="h-2.5 w-2.5 text-destructive fill-current" />}
      </div>
      {item.title && item.title !== 'Reflection' && (
        <p className="text-xs font-medium text-foreground leading-snug">{item.title}</p>
      )}
      {bodyText && (
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2">
          {item.source_type === 'haiku' ? <span className="italic">{bodyText}</span> : bodyText}
        </p>
      )}
    </button>
  );
}

export function ItemDetailViewer({
  item, linkedItems, allItems, open, onClose, onToggleFavorite,
  onTogglePin, onDelete, onStatusChange, onUpdateTags, onSelectItem,
  collections, getItemCollections, onAddToCollection, onRemoveFromCollection,
  isIncomplete, onOutcomeRecorded, currentOutcome,
}: Props) {
  const { t } = useTranslation();
  const onStatusChangeRef = useRef(onStatusChange);
  useLayoutEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);
  const navigate = useNavigate();
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [recordedOutcome, setRecordedOutcome] = useState<string | null>(null);
  const [showOutcomePicker, setShowOutcomePicker] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTags) tagInputRef.current?.focus();
  }, [editingTags]);

  // Reset editing state when item changes
  useEffect(() => {
    setEditingTags(false);
    setTagInput('');
    setShowCollections(false);
    setRecordedOutcome(null);
    setShowOutcomePicker(false);
  }, [item?.id]);

  // Auto-mark as read when opened (callback via ref so parent identity changes do not re-trigger).
  useEffect(() => {
    if (open && item && item.status === 'unread') {
      onStatusChangeRef.current(item.id, 'read');
    }
  }, [open, item]);

  const siblings = useMemo(() => {
    if (!item?.pause_instance_id || !allItems) return [];
    return allItems.filter((i) => i.pause_instance_id === item.pause_instance_id && i.id !== item.id && i.status !== 'deleted');
  }, [item, allItems]);

  const zoomOutData = useMemo((): ZoomOutParsedBody | null => {
    if (item?.source_type !== 'zoom_out' || !item?.body) return null;
    try {
      return JSON.parse(item.body) as ZoomOutParsedBody;
    } catch {
      return null;
    }
  }, [item?.source_type, item?.body]);

  const itemCollections = useMemo(() => {
    if (!item || !getItemCollections) return [];
    return getItemCollections(item.id);
  }, [item, getItemCollections]);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || !item || item.tags.includes(trimmed)) return;
    onUpdateTags(item.id, [...item.tags, trimmed]);
    setTagInput('');
  }, [item, onUpdateTags]);

  const removeTag = useCallback((tag: string) => {
    if (!item) return;
    onUpdateTags(item.id, item.tags.filter((t) => t !== tag));
  }, [item, onUpdateTags]);

  const handleRecordOutcome = useCallback(async (outcome: string) => {
    if (!item?.pause_instance_id || outcomeLoading) return;
    setOutcomeLoading(true);
    // Log outcome_logged step event via the RPC. The instance may already
    // be terminal (expired) — the RPC silently no-ops in that case but
    // leaves a record we can use for retrospective analytics.
    const { pauseLogStep } = await import('@/lib/pause-api');
    await pauseLogStep({
      instanceId: item.pause_instance_id,
      stepType: 'outcome_logged',
      payload: { outcome },
    }).catch(() => undefined);
    setOutcomeLoading(false);
    setRecordedOutcome(outcome);
    setShowOutcomePicker(false);
    onOutcomeRecorded?.();
  }, [item?.pause_instance_id, outcomeLoading, onOutcomeRecorded]);

  if (!item) return null;

  const companions = linkedItems && linkedItems.length > 0 ? linkedItems : siblings;
  const isReflection = item.source_type === 'reflection';
  const sourceLabel = librarySourceLabel(item.source_type, t, item.source_type ?? 'Item');
  const emoji = SOURCE_EMOJIS[item.source_type ?? ''] ?? TYPE_EMOJIS[item.type] ?? '📄';

  // Determine the effective outcome: freshly recorded > current from DB
  const effectiveOutcome = recordedOutcome ?? currentOutcome;
  // Show the outcome section for pause-linked library bookmarks (source_type reflection): incomplete or recorded outcome
  const showOutcomeSection = isReflection && item.pause_instance_id;

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <SheetTitle className="text-sm font-mono flex-1">
              {isReflection ? t('librarySources.reflection') : sourceLabel}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          {/* Timestamp + status */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-mono text-muted-foreground/50 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {format(new Date(item.created_at), 'MMM d, yyyy · h:mm a')}
            </span>
            {item.pinned && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary">
                📌 {t('common.pinned')}
              </span>
            )}
          </div>

          {/* Title */}
          {item.title && !(isReflection && item.title === 'Reflection') && (
            <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
          )}

          {/* Body content */}
          {(() => {
            const bodyStr = typeof item.body === 'string' ? item.body : item.body ? JSON.stringify(item.body) : null;
            if (item.source_type === 'haiku' && bodyStr) {
              return (
                <div className="py-4 px-2">
                  <p className="text-base text-foreground/80 leading-loose whitespace-pre-line italic text-center">{bodyStr}</p>
                </div>
              );
            }
            if (item.source_type === 'zoom_out' && zoomOutData) {
              return (
                <div className="space-y-3">
                  {zoomOutData.onThisDay?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('itemDetail.onThisDay')}</p>
                      {[...zoomOutData.onThisDay].reverse().map((entry: ZoomOutOnThisDayEntry) => (
                        <div key={entry.yearsAgo} className="flex items-center justify-between gap-2 text-xs font-mono">
                          <span className="text-muted-foreground/60 w-14 shrink-0">{t('itemDetail.yearsAgo', { count: entry.yearsAgo })}</span>
                          <span className="text-muted-foreground tabular-nums">${entry.price?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {zoomOutData.echo?.message && (
                    <div className="space-y-1 border-l-2 border-border/40 pl-3">
                      <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('itemDetail.echo')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{zoomOutData.echo.message}"</p>
                    </div>
                  )}
                  {zoomOutData.deepTime && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('itemDetail.deepTime')}</p>
                      {typeof zoomOutData.deepTime === 'string' ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">{zoomOutData.deepTime}</p>
                      ) : (
                        <>
                          <p className="text-[10px] font-mono text-foreground/70 uppercase tracking-wide leading-snug">{zoomOutData.deepTime.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{zoomOutData.deepTime.body}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            if (bodyStr) {
              return <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{bodyStr}</p>;
            }
            return null;
          })()}

          {item.pause_instance_id &&
            (item.source_type === 'zoom_out' || item.source_type === 'history_insight') && (
              <button
                type="button"
                onClick={() => {
                  const path =
                    item.source_type === 'zoom_out'
                      ? `/companion/zoom-out/${item.pause_instance_id}`
                      : `/companion/history/${item.pause_instance_id}`;
                  navigate(path, { state: { from: 'library' } });
                  onClose();
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 py-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/35"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
                {t('companions.openFullView')}
              </button>
            )}

          {/* Companion feedback — for companion-type library items */}
          {item.source_type && ['signal', 'grounding', 'learning', 'zoom_out', 'history_insight', 'haiku'].includes(item.source_type) && item.pause_instance_id && (
            <CompanionFeedback
              pauseInstanceId={item.pause_instance_id}
              companionType={item.source_type}
            />
          )}

          {/* Decision outcome section */}
          {showOutcomeSection && (
            <>
              {effectiveOutcome && !showOutcomePicker ? (
                <button
                  onClick={() => setShowOutcomePicker(true)}
                  className="w-full rounded-lg border border-border/30 bg-card/30 p-3 flex items-center gap-3 hover:bg-card/50 transition-colors group"
                >
                  <OutcomeIcon outcome={effectiveOutcome} size={18} className="text-primary/60" />
                  <div className="flex-1 text-left">
                    <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider">
                      {t('library.decisionLabel', 'Decision')}
                    </p>
                    <p className="text-xs font-mono text-foreground/70">
                      {t(`ritual.decide.${effectiveOutcome === 'held' ? 'hold' : effectiveOutcome === 'sold' ? 'sell' : 'buy'}`, effectiveOutcome)}
                    </p>
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground/20 group-hover:text-muted-foreground/40 uppercase tracking-wider transition-colors">
                    {t('library.changeDecision', 'Change')}
                  </span>
                </button>
              ) : (
                <div className="rounded-lg border border-border/30 bg-card/30 p-3 space-y-2.5">
                  <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                    {effectiveOutcome
                      ? t('library.changeDecisionLabel', 'Change decision')
                      : t('library.incompleteLabel', 'No decision recorded')}
                  </p>
                  {!effectiveOutcome && (
                    <p className="text-xs text-muted-foreground/60 leading-relaxed">
                      {t('library.incompleteDescription', 'What did you end up doing after this pause?')}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {OUTCOME_OPTIONS.map(({ key, labelKey }) => (
                      <button
                        key={key}
                        onClick={() => handleRecordOutcome(key)}
                        disabled={outcomeLoading}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-mono py-2 px-2 rounded-md border transition-colors disabled:opacity-50 ${
                          effectiveOutcome === key
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'border-border/40 bg-card/50 text-foreground/70 hover:bg-card hover:border-foreground/20'
                        }`}
                      >
                        <OutcomeIcon outcome={key} size={14} />
                        {t(labelKey, key)}
                      </button>
                    ))}
                  </div>
                  {effectiveOutcome && (
                    <button
                      onClick={() => setShowOutcomePicker(false)}
                      className="text-[9px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Source URL */}
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {t('itemDetail.viewSource')}
            </a>
          )}

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.tags.map((tag) => (
                editingTags ? (
                  <button
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Tag className="h-2 w-2" />{tag}
                    <X className="h-2 w-2 text-primary/50 ml-0.5" />
                  </button>
                ) : (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/70">
                    <Tag className="h-2 w-2" />{tag}
                  </span>
                )
              ))}
              <button
                onClick={() => setEditingTags(!editingTags)}
                className="text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {editingTags ? t('common.done') : `+ ${t('libraryCard.tag')}`}
              </button>
            </div>
            {editingTags && (
              <input
                ref={tagInputRef}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput); }
                  if (e.key === 'Escape') setEditingTags(false);
                }}
                placeholder={t('libraryCard.tagPlaceholder')}
                className="w-full text-[10px] font-mono px-2 py-1 rounded border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
              />
            )}
          </div>

          {/* Collection badges */}
          {itemCollections.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {itemCollections.map((col) => (
                <span key={col.id} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground/70">
                  {col.icon ?? '📂'} {col.name}
                </span>
              ))}
            </div>
          )}

          {/* Companions */}
          {companions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-3 w-3 text-muted-foreground/40" />
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                  {isReflection ? t('itemDetail.companions') : t('itemDetail.relatedItems')}
                </p>
              </div>
              <div className="space-y-1.5">
                {companions.map((li) => (
                  <CompanionCard key={li.id} item={li} onSelect={onSelectItem} />
                ))}
              </div>
            </div>
          )}

          {/* Actions toolbar */}
          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleFavorite(item.id)}
                  className={`p-2 rounded-md transition-colors ${item.is_favorite ? 'text-destructive bg-destructive/10' : 'text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5'}`}
                  aria-label={item.is_favorite ? t('libraryCard.removeFavorite') : t('libraryCard.addFavorite')}
                >
                  <Heart className={`h-4 w-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => onTogglePin(item.id)}
                  className={`p-2 rounded-md transition-colors ${item.pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'}`}
                  aria-label={item.pinned ? t('common.unpin') : t('common.pinned')}
                >
                  {item.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onStatusChange(item.id, item.status === 'archived' ? 'read' : 'archived')}
                  className={`p-2 rounded-md transition-colors ${item.status === 'archived' ? 'text-foreground bg-muted' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'}`}
                  aria-label={t('libraryCard.archive')}
                >
                  <Archive className="h-4 w-4" />
                </button>
                {collections && collections.length > 0 && onAddToCollection && onRemoveFromCollection && (
                  <button
                    onClick={() => setShowCollections(!showCollections)}
                    className={`p-2 rounded-md transition-colors ${showCollections ? 'text-foreground bg-muted' : 'text-muted-foreground/50 hover:text-foreground hover:bg-muted'}`}
                    aria-label="Add to collection"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={handleDelete}
                className="p-2 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
                aria-label={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Collection picker */}
            {showCollections && collections && onAddToCollection && onRemoveFromCollection && (
              <div className="mt-2 space-y-1 rounded-md border border-border/40 bg-card/30 p-2">
                {collections.map((col) => {
                  const isIn = itemCollections.some((c) => c.id === col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={async () => {
                        if (isIn) await onRemoveFromCollection(col.id, item.id);
                        else await onAddToCollection(col.id, item.id);
                      }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-muted transition-colors"
                    >
                      <span className="text-xs">{col.icon ?? '📂'}</span>
                      <span className="text-[11px] font-mono text-foreground flex-1 truncate">{col.name}</span>
                      {isIn && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
