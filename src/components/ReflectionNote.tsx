import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Pencil, Check } from 'lucide-react';
import { WritingField } from '@/components/WritingField';
import { Button } from '@/components/ui/button';

interface Props {
  reflectionId: string;
  initialNote: string | null;
}

const DEBOUNCE_MS = 1000;

export function ReflectionNote({ reflectionId, initialNote }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote ?? '');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  /** After first load for this reflectionId; avoids autosave overwriting DB before hydrate. */
  const [hydrated, setHydrated] = useState(false);
  const savedToLibraryRef = useRef(!!initialNote);

  const syncNoteToBackend = useCallback(async (trimmed: string | null) => {
    await supabase.from('reflections').update({ note: trimmed }).eq('id', reflectionId);

    if (trimmed && user && !savedToLibraryRef.current) {
      savedToLibraryRef.current = true;
      await supabase
        .from('library_items')
        .insert({
          user_id: user.id,
          type: 'note',
          title: 'Session note',
          body: trimmed,
          source_type: 'reflection_note',
          reflection_id: reflectionId,
          tags: [],
        } as any);
    } else if (trimmed && savedToLibraryRef.current) {
      await supabase
        .from('library_items')
        .update({ body: trimmed } as any)
        .eq('reflection_id', reflectionId)
        .eq('source_type', 'reflection_note');
    }
  }, [reflectionId, user]);

  // Reload from DB when remounting (e.g. pause step away → back); props often pass initialNote=null.
  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    if (initialNote != null && initialNote !== '') {
      setNote(initialNote);
      savedToLibraryRef.current = true;
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('note')
        .eq('id', reflectionId)
        .maybeSingle();
      if (cancelled || error || !data) {
        if (!cancelled) setHydrated(true);
        return;
      }
      const loaded = typeof data.note === 'string' ? data.note : '';
      setNote(loaded);
      if (loaded.trim()) {
        const { count } = await supabase
          .from('library_items')
          .select('id', { count: 'exact', head: true })
          .eq('reflection_id', reflectionId)
          .eq('source_type', 'reflection_note');
        if (!cancelled) savedToLibraryRef.current = (count ?? 0) > 0;
      } else if (!cancelled) {
        savedToLibraryRef.current = false;
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [reflectionId, initialNote]);

  // Debounced autosave while typing (same persistence as Save, without closing the editor).
  useEffect(() => {
    if (!hydrated || !editing) return;
    const trimmed = note.trim() || null;
    const t = setTimeout(() => {
      void syncNoteToBackend(trimmed);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [note, hydrated, editing, syncNoteToBackend]);

  const save = useCallback(async () => {
    setEditing(false);
    setSaved(true);
    await syncNoteToBackend(note.trim() || null);
    setTimeout(() => setSaved(false), 1500);
  }, [note, syncNoteToBackend]);

  if (!editing && !note.trim()) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex w-full max-w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input/80 bg-muted/15 px-3 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-input hover:bg-muted/25 hover:text-foreground sm:justify-start"
      >
        <Pencil className="h-4 w-4 shrink-0 opacity-70" />
        {t('reflectionNote.addNote')}
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="group relative min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 pr-10">
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap break-anywhere">
          {note}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="absolute top-2 right-2 rounded-md p-1.5 text-muted-foreground opacity-70 transition-all hover:bg-muted/50 hover:text-foreground group-hover:opacity-100"
          aria-label={t('reflectionNote.editNote')}
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-3">
      <WritingField
        value={note}
        onChange={setNote}
        placeholder={t('reflectionNote.placeholder')}
        minRows={4}
        autoFocus
        disableFocusMode
      />
      <div className="flex flex-col items-end gap-2">
        <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={save}>
          <Check className="h-3.5 w-3.5" />
          {saved ? t('reflectionNote.saved') : t('reflectionNote.save')}
        </Button>
        <p className="max-w-md text-right text-xs leading-relaxed text-muted-foreground">
          {t(
            'reflectionNote.autosaveHint',
            'Your note also saves automatically a moment after you stop typing.',
          )}
        </p>
      </div>
    </div>
  );
}
