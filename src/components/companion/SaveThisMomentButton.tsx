import { useCallback, useState } from 'react';
import { Lock, PenLine, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useProGate } from '@/hooks/use-pro-gate';
import { useSaveToLibrary } from '@/hooks/use-library';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  /** Companion card title — used to seed the journal entry's title. */
  seedTitle: string;
  /** Companion card body — used as context for the user's own note. */
  seedContext: string;
  /** Which companion this moment came from. Used for `source_type` + tags. */
  companion: 'signal' | 'grounding' | 'history' | 'zoomOut';
  /** Current reflection id — links the saved note back to the pause session. */
  pauseInstanceId?: string | null;
}

/**
 * Pro-gated "save this moment as a journal note" CTA for companion Full Views.
 *
 * Unlike `SaveToLibraryButton` (which bookmarks the AI-generated card itself),
 * this one captures what the *user* is thinking *right now* while reading the
 * card — a lightweight reflective note, seeded with the card for context.
 *
 * Free users see a locked state with a Pro upgrade toast on tap. Pro users see
 * a textarea below the button where they can write, then save. Writes a row to
 * `library_items` with `type: 'note'`, `source_type: 'companion_moment'`, tags
 * `['moment', <companion>]`, so the saved moment shows up in the library.
 */
export function SaveThisMomentButton({ seedTitle, seedContext, companion, pauseInstanceId }: Props) {
  const { t } = useTranslation();
  const { isPro, requirePro } = useProGate();
  const saveToLibrary = useSaveToLibrary();

  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOpen = useCallback(() => {
    if (!requirePro('save_moment')) return;
    setOpen(true);
  }, [requirePro]);

  const handleSave = useCallback(async () => {
    if (!body.trim()) return;
    setSaving(true);
    const noteTitle = t('companions.fullview.saveMoment.titlePrefix', { title: seedTitle }).slice(0, 180);
    const result = await saveToLibrary({
      type: 'note',
      title: noteTitle,
      body: body.trim(),
      source_type: 'companion_moment',
      pause_instance_id: pauseInstanceId ?? undefined,
      tags: ['moment', companion],
    });
    setSaving(false);
    if (result) {
      setSaved(true);
      setOpen(false);
      hapticFeedback('success');
      toast.success(t('companions.fullview.saveMoment.saved'));
    } else {
      toast.error(t('common.tryAgain'));
    }
  }, [body, saveToLibrary, seedTitle, companion, pauseInstanceId, t]);

  if (saved) {
    return (
      <p className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/70">
        <Check className="h-2.5 w-2.5" aria-hidden />
        {t('companions.fullview.saveMoment.saved')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/55 hover:text-foreground transition-colors"
        aria-label={t('companions.fullview.saveMoment.trigger')}
      >
        {isPro ? (
          <PenLine className="h-2.5 w-2.5" aria-hidden />
        ) : (
          <Lock className="h-2.5 w-2.5" aria-hidden />
        )}
        <span>{t('companions.fullview.saveMoment.trigger')}</span>
        {!isPro && (
          <span className="rounded-sm border border-primary/30 px-1 py-[1px] text-[8px] tracking-wide text-primary/70">
            {t('pro.badge')}
          </span>
        )}
      </button>

      {open && isPro && (
        <div className="space-y-2 rounded-md border border-border/60 bg-background p-2.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 leading-relaxed">
            {t('companions.fullview.saveMoment.contextHint', { title: seedTitle })}
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            autoFocus
            placeholder={t('companions.fullview.saveMoment.placeholder')}
            className="w-full resize-y rounded-md border border-border/60 bg-transparent p-2 text-xs font-mono text-foreground/85 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !body.trim()}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? t('common.loading') : t('companions.fullview.saveMoment.saveCta')}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setBody('');
              }}
              className="text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
          {/* Pulling context through to the note itself is intentional — if the
              user ever re-reads this in Library they should be able to tell
              *which* card prompted the note. We prepend `seedContext` to the
              saved body server-side later; for now we just hint it in-copy. */}
        </div>
      )}
    </div>
  );
}
