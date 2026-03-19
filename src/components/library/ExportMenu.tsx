import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { exportAsCSV, exportAsMarkdown, downloadFile } from '@/lib/library-export';
import type { LibraryItem } from '@/hooks/use-library';
import { format } from 'date-fns';
import { useState } from 'react';

interface Props {
  items: LibraryItem[];
  label?: string;
}

export function ExportMenu({ items }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const stamp = format(new Date(), 'yyyy-MM-dd');

  const handleCSV = () => {
    downloadFile(exportAsCSV(items), `library-${stamp}.csv`, 'text/csv');
    setOpen(false);
  };

  const handleMarkdown = () => {
    downloadFile(exportAsMarkdown(items), `library-${stamp}.md`, 'text/markdown');
    setOpen(false);
  };

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <Download className="h-2.5 w-2.5" />
          {t('library.export', { defaultValue: 'Export' })}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1.5 space-y-0.5">
        <button
          onClick={handleCSV}
          className="w-full text-left text-[10px] font-mono px-2 py-1.5 rounded hover:bg-accent transition-colors text-foreground/80"
        >
          CSV (.csv)
        </button>
        <button
          onClick={handleMarkdown}
          className="w-full text-left text-[10px] font-mono px-2 py-1.5 rounded hover:bg-accent transition-colors text-foreground/80"
        >
          Markdown (.md)
        </button>
        <p className="text-[8px] font-mono text-muted-foreground/30 px-2 pt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </PopoverContent>
    </Popover>
  );
}
