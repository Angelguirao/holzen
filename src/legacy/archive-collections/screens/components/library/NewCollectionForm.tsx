import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ICONS = ['📂', '📚', '🎯', '💡', '🔥', '🧠', '⚡', '🌊', '🏔️', '🎨', '📌', '🗂️'];

interface Props {
  onSave: (name: string, description: string, icon: string) => Promise<void>;
}

export function NewCollectionForm({ onSave }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📂');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) nameRef.current?.focus();
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim(), icon);
    setName('');
    setDescription('');
    setIcon('📂');
    setOpen(false);
    setSaving(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {t('library.newCollection')}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`text-sm p-0.5 rounded transition-colors ${
                icon === ic ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleSave(); }}
        placeholder={t('library.collectionNamePlaceholder')}
        maxLength={80}
        className="w-full text-xs font-medium bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('library.collectionDescPlaceholder')}
        maxLength={200}
        className="w-full text-[11px] font-mono bg-transparent text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none"
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="text-xs font-mono h-7">
          {t('common.cancel')}
        </Button>
        <LoadingButton size="sm" onClick={handleSave} loading={saving} disabled={!name.trim()} className="text-xs font-mono h-7">
          {t('library.create')}
        </LoadingButton>
      </div>
    </div>
  );
}
