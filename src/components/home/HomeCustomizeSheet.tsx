import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  ALL_HOME_SECTION_IDS,
  isHomeSectionAlwaysVisibleInLayout,
} from '@/hooks/use-home-optional-visibility';
import { GOAL_WHY_SECTION_ID, normalizeHomeSectionOrder } from '@/lib/home-section-order-normalize';

export interface HomeCustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: string[];
  onReorder: (next: string[]) => void;
  visible: Record<string, boolean>;
  onSetVisible: (id: string, value: boolean) => void;
  sectionTitle: (id: string) => string;
  sectionDescription: (id: string) => string;
  zenMode: boolean;
  onZenModeChange: (zen: boolean) => void;
  onResetAll: () => void;
  /** When true, Night reflection toggle is disabled (e.g. not Pro). */
  nightToggleDisabled?: boolean;
  /** Bump after reset-to-defaults so @dnd-kit remounts and matches parent `order`. */
  dndRemountKey?: number;
}

function isDraggableTailHomeSectionId(id: string): boolean {
  return id !== GOAL_WHY_SECTION_ID && (ALL_HOME_SECTION_IDS as readonly string[]).includes(id);
}

/** Pinned first row — not registered with @dnd-kit/sortable (lives outside `SortableContext`). */
function CustomizePinnedRow({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3',
      )}
    >
      <div className="h-9 w-10 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={`home-section-${id}`} className="text-sm font-medium leading-snug text-foreground">
          {title}
        </Label>
        <p className={cn(homeInWidget.metaFaint, 'leading-snug')}>{description}</p>
      </div>
      <div className="h-6 w-10 shrink-0" aria-hidden />
    </div>
  );
}

function CustomizeSortableRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  switchDisabled,
  showSwitch,
  disableSortable,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  switchDisabled?: boolean;
  showSwitch: boolean;
  /** When true, `useSortable` is disabled (no transform from DnD). */
  disableSortable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: disableSortable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.92 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(disableSortable ? attributes : {})}
      className={cn(
        'flex items-start gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3',
        isDragging && 'shadow-md',
      )}
    >
      {disableSortable ? (
        <div className="h-9 w-10 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          className="touch-none cursor-grab shrink-0 rounded-md p-1.5 text-muted-foreground/50 hover:bg-muted/60 hover:text-muted-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <Label htmlFor={`home-section-${id}`} className="text-sm font-medium leading-snug text-foreground">
          {title}
        </Label>
        <p className={cn(homeInWidget.metaFaint, 'leading-snug')}>{description}</p>
      </div>
      {showSwitch ? (
        <Switch
          id={`home-section-${id}`}
          checked={!!checked}
          disabled={switchDisabled}
          onCheckedChange={onCheckedChange}
          className="shrink-0"
        />
      ) : (
        <div className="h-6 w-10 shrink-0" aria-hidden />
      )}
    </div>
  );
}

export function HomeCustomizeSheet({
  open,
  onOpenChange,
  order,
  onReorder,
  visible,
  onSetVisible,
  sectionTitle,
  sectionDescription,
  zenMode,
  onZenModeChange,
  onResetAll,
  nightToggleDisabled,
  dndRemountKey = 0,
}: HomeCustomizeSheetProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 10 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      if (!isDraggableTailHomeSectionId(activeId) || !isDraggableTailHomeSectionId(overId)) return;
      const norm = normalizeHomeSectionOrder(order, ALL_HOME_SECTION_IDS);
      const tailIds = norm.filter((id) => id !== GOAL_WHY_SECTION_ID);
      const oldIndex = tailIds.indexOf(activeId);
      const newIndex = tailIds.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      const newTail = arrayMove(tailIds, oldIndex, newIndex);
      onReorder(normalizeHomeSectionOrder([GOAL_WHY_SECTION_ID, ...newTail], ALL_HOME_SECTION_IDS));
    },
    [order, onReorder],
  );

  const tailOrder = order.filter((id) => id !== GOAL_WHY_SECTION_ID);

  const modeValue = zenMode ? 'zen' : 'hold';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8 pt-6">
        <SheetHeader className="space-y-2 px-1 pr-10 text-center sm:text-center">
          <SheetTitle className="text-base font-semibold sm:text-lg">
            {t('home.customizeSheet.title')}
          </SheetTitle>
          <SheetDescription className="text-balance">
            {t('home.customizeSheet.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section className="space-y-3" aria-labelledby="home-customize-mode">
            <h3 id="home-customize-mode" className={cn(homeInWidget.kickerAccent, 'text-xs')}>
              {t('home.customizeSheet.modeHeading')}
            </h3>
            <RadioGroup
              value={modeValue}
              onValueChange={(v) => onZenModeChange(v === 'zen')}
              className="grid gap-3"
            >
              <label
                htmlFor="home-mode-hold"
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:bg-muted/30',
                  modeValue === 'hold' && 'border-ring bg-muted/50 ring-1 ring-ring/40',
                )}
              >
                <RadioGroupItem id="home-mode-hold" value="hold" className="mt-0.5 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{t('home.customizeSheet.holdModeTitle')}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{t('home.customizeSheet.holdModeDesc')}</p>
                </div>
              </label>
              <label
                htmlFor="home-mode-zen"
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:bg-muted/30',
                  modeValue === 'zen' && 'border-ring bg-muted/50 ring-1 ring-ring/40',
                )}
              >
                <RadioGroupItem id="home-mode-zen" value="zen" className="mt-0.5 shrink-0" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{t('home.customizeSheet.zenModeTitle')}</p>
                  <p className="text-xs leading-snug text-muted-foreground">{t('home.customizeSheet.zenModeDesc')}</p>
                </div>
              </label>
            </RadioGroup>
          </section>

          <section className="space-y-3" aria-labelledby="home-customize-widgets">
            <div className="flex items-center justify-between gap-3">
              <h3 id="home-customize-widgets" className={cn(homeInWidget.kickerAccent, 'text-xs')}>
                {t('home.customizeSheet.widgetsHeading')}
              </h3>
              <button
                type="button"
                onClick={onResetAll}
                className="shrink-0 text-xs font-medium text-foreground underline underline-offset-4 decoration-foreground/40 hover:decoration-foreground"
              >
                {t('home.customizeSheet.resetLink')}
              </button>
            </div>

            <DndContext
              key={dndRemountKey}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <div className="flex flex-col gap-3">
                <CustomizePinnedRow
                  key={GOAL_WHY_SECTION_ID}
                  id={GOAL_WHY_SECTION_ID}
                  title={sectionTitle(GOAL_WHY_SECTION_ID)}
                  description={sectionDescription(GOAL_WHY_SECTION_ID)}
                />
                <SortableContext items={tailOrder} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-3">
                    {tailOrder.map((id) => {
                      const noVisibilityToggle = isHomeSectionAlwaysVisibleInLayout(id);
                      return (
                        <CustomizeSortableRow
                          key={id}
                          id={id}
                          title={sectionTitle(id)}
                          description={sectionDescription(id)}
                          checked={!!visible[id]}
                          onCheckedChange={(v) => onSetVisible(id, v)}
                          switchDisabled={id === 'night' && nightToggleDisabled}
                          showSwitch={!noVisibilityToggle}
                          disableSortable={false}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </div>
            </DndContext>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
