import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ToolCatalogId } from '@/lib/tools-catalog';
import { getToolCatalogEntry } from '@/lib/tools-catalog';
import { ToolsActivitiesEditSheet } from '@/components/tools/ToolsActivitiesEditSheet';

type Props = {
  favoriteIds: ToolCatalogId[];
  allSelectableIds: readonly ToolCatalogId[];
  onSaveFavorites: (ids: ToolCatalogId[]) => void;
};

export function ToolsYourActivitiesSection({ favoriteIds, allSelectableIds, onSaveFavorites }: Props) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<ToolCatalogId[]>(favoriteIds);

  const openSheet = useCallback(() => {
    setDraftIds(favoriteIds);
    setSheetOpen(true);
  }, [favoriteIds]);

  const onToggle = useCallback((id: ToolCatalogId, checked: boolean) => {
    setDraftIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id].slice(0, 8);
      }
      return prev.filter((x) => x !== id);
    });
  }, []);

  const onSave = useCallback(() => {
    onSaveFavorites(draftIds);
    setSheetOpen(false);
  }, [draftIds, onSaveFavorites]);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium text-foreground">{t('tools.hub.soYou')}</h2>

      <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {t('tools.hub.yourActivities')}
          </p>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={openSheet} aria-label={t('tools.hub.editActivities')}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="mt-2 text-sm leading-snug text-muted-foreground">{t('tools.hub.yourActivitiesBody')}</p>

        {favoriteIds.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground/90">{t('tools.hub.activitiesHint')}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {favoriteIds.map((id) => {
              const entry = getToolCatalogEntry(id);
              return (
                <Badge key={id} variant="default" className="rounded-full px-3 py-1 font-normal">
                  {t(entry.hubTitleKey ?? entry.labelKey)}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <ToolsActivitiesEditSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        selectableIds={allSelectableIds}
        draftIds={draftIds}
        onToggle={onToggle}
        onSave={onSave}
      />
    </section>
  );
}
