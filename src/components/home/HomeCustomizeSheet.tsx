import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OPTIONAL_HOME_WIDGET_IDS } from '@/hooks/use-home-optional-visibility';

export interface HomeCustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visible: Record<string, boolean>;
  onSetVisible: (id: string, value: boolean) => void;
  widgetTitle: (id: string) => string;
  onResetLayout: () => void;
  onResetOptionalVisibility: () => void;
}

export function HomeCustomizeSheet({
  open,
  onOpenChange,
  visible,
  onSetVisible,
  widgetTitle,
  onResetLayout,
  onResetOptionalVisibility,
}: HomeCustomizeSheetProps) {
  const { t } = useTranslation();

  const handleResetAll = () => {
    onResetLayout();
    onResetOptionalVisibility();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('home.customizeSheet.title')}</SheetTitle>
          <SheetDescription>{t('home.customizeSheet.description')}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {OPTIONAL_HOME_WIDGET_IDS.map((id) => (
            <div key={id} className="flex items-center justify-between gap-4 rounded-lg border border-border/50 px-3 py-2">
              <Label htmlFor={`home-opt-${id}`} className="text-sm font-medium leading-snug">
                {widgetTitle(id)}
              </Label>
              <Switch
                id={`home-opt-${id}`}
                checked={!!visible[id]}
                onCheckedChange={(v) => onSetVisible(id, v)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full gap-2" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t('home.customizeSheet.resetLayout')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
