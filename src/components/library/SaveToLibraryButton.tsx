import { useState, useCallback } from 'react';
import { Bookmark, Check } from 'lucide-react';
import { useSaveToLibrary } from '@/hooks/use-library';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Props {
  title?: string;
  body?: string;
  sourceType: string;
  sourceUrl?: string;
  reflectionId?: string;
  tags?: string[];
}

export function SaveToLibraryButton({ title, body, sourceType, sourceUrl, reflectionId, tags }: Props) {
  const { t } = useTranslation();
  const saveToLibrary = useSaveToLibrary();
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    if (saved) return;
    const result = await saveToLibrary({
      type: 'bookmark',
      title: title || undefined,
      body: body || undefined,
      source_type: sourceType,
      source_url: sourceUrl,
      reflection_id: reflectionId,
      tags: tags ?? [],
    });
    if (result) {
      setSaved(true);
      toast.success(t('library.savedToLibrary'));
    }
  }, [saved, saveToLibrary, title, body, sourceType, sourceUrl, reflectionId, tags, t]);

  return (
    <button
      onClick={handleSave}
      className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
      aria-label="Save to library"
    >
      {saved ? <Check className="h-2.5 w-2.5 text-primary" /> : <Bookmark className="h-2.5 w-2.5" />}
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
