import { useState, useCallback, useRef } from 'react';
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

export function ReflectionNote({ reflectionId, initialNote }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [note, setNote] = useState(initialNote ?? '');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedToLibraryRef = useRef(!!initialNote);

  const save = useCallback(async () => {
    setEditing(false);
    setSaved(true);
    const trimmed = note.trim() || null;
    await supabase
      .from('reflections')
      .update({ note: trimmed })
      .eq('id', reflectionId);

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

    setTimeout(() => setSaved(false), 1500);
  }, [reflectionId, note, user]);

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
      <div className="group relative rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 pr-10">
        <p className="text-sm leading-relaxed text-muted-foreground">
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
    <div className="space-y-3">
      <WritingField
        value={note}
        onChange={setNote}
        placeholder={t('reflectionNote.placeholder')}
        minRows={4}
        autoFocus
        disableFocusMode
      />
      <div className="flex justify-end">
        <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={save}>
          <Check className="h-3.5 w-3.5" />
          {saved ? t('reflectionNote.saved') : t('reflectionNote.save')}
        </Button>
      </div>
    </div>
  );
}
