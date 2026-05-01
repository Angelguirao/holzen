import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ToolCatalogId } from '@/lib/tools-catalog';
import { getToolCatalogEntry } from '@/lib/tools-catalog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectableIds: readonly ToolCatalogId[];
  draftIds: ToolCatalogId[];
  onToggle: (id: ToolCatalogId, checked: boolean) => void;
  onSave: () => void;
};

export function ToolsActivitiesEditSheet({
  open,
  onOpenChange,
  selectableIds,
  draftIds,
  onToggle,
  onSave,
}: Props) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8 pt-6">
        <SheetHeader className="text-left">
          <SheetTitle>{t('tools.hub.editActivitiesTitle')}</SheetTitle>
          <SheetDescription>{t('tools.hub.editActivitiesDesc')}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {selectableIds.map((id) => {
            const entry = getToolCatalogEntry(id);
            const checked = draftIds.includes(id);
            return (
              <div
                key={id}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-3"
              >
                <Checkbox
                  id={`tool-act-${id}`}
                  checked={checked}
                  onCheckedChange={(v) => onToggle(id, v === true)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`tool-act-${id}`} className="text-sm font-medium leading-snug">
                    {t(entry.hubTitleKey ?? entry.labelKey)}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{t(entry.blurbKey)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <Button type="button" className="mt-6 w-full" onClick={onSave}>
          {t('tools.hub.editActivitiesSave')}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
