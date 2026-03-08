import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Pencil, Check } from 'lucide-react';

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

    // Auto-save new notes to library
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
      // Update existing library item body
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
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Pencil className="h-2.5 w-2.5" />
        {t('reflectionNote.addNote')}
      </button>
    );
  }

  if (!editing) {
    return (
      <div className="group relative">
        <p className="text-xs text-muted-foreground/70 italic leading-relaxed pr-6">
          {note}
        </p>
        <button
          onClick={() => setEditing(true)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground transition-all p-0.5"
          aria-label="Edit note"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }}
        placeholder="How did this make you feel?"
        rows={2}
        className="w-full rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={save}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <Check className="h-2.5 w-2.5" />
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}
