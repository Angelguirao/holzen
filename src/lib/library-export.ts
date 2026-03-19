import type { LibraryItem } from '@/hooks/use-library';
import { format } from 'date-fns';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportAsCSV(items: LibraryItem[]): string {
  const header = ['Date', 'Title', 'Body', 'Source', 'Tags', 'Favorite'];
  const rows = items.map((item) => [
    format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
    escapeCSV(item.title ?? ''),
    escapeCSV((item.body ?? '').replace(/\n/g, ' ')),
    item.source_type ?? '',
    (item.tags ?? []).join('; '),
    item.is_favorite ? 'Yes' : '',
  ]);
  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportAsMarkdown(items: LibraryItem[]): string {
  return items
    .map((item) => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd HH:mm');
      const title = item.title ?? 'Untitled';
      const tags = item.tags?.length ? `Tags: ${item.tags.map((t) => `#${t}`).join(' ')}` : '';
      const fav = item.is_favorite ? ' ⭐' : '';
      const source = item.source_type ? `*${item.source_type}*` : '';
      const meta = [date, source, tags].filter(Boolean).join(' · ');
      return `## ${title}${fav}\n\n${meta}\n\n${item.body ?? ''}\n`;
    })
    .join('\n---\n\n');
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
