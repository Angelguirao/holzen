import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Pencil, Check } from 'lucide-react';

interface Props {
  reflectionId: string;
  initialNote: string | null;
}

export function ReflectionNote({ reflectionId, initialNote }: Props) {
  const [note, setNote] = useState(initialNote ?? '');
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    setEditing(false);
    setSaved(true);
    await supabase
      .from('reflections')
      .update({ note: note.trim() || null })
      .eq('id', reflectionId);
    setTimeout(() => setSaved(false), 1500);
  }, [reflectionId, note]);

  if (!editing && !note.trim()) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <Pencil className="h-2.5 w-2.5" />
        Add a note
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
