import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
} from '@/screens/home/lib/home-section-visibility-constants';
import { GOAL_WHY_SECTION_ID, normalizeHomeSectionOrder } from '@/screens/home/lib/home-section-order-normalize';

/** Wireframes 251:13802 — inset cards, 16px titles, 14px descriptions. */
const customizeCardClass =
  'rounded-lg border-2 border-border/60 bg-muted/30 p-4';

const customizeTitleClass = 'text-base font-medium leading-6 text-foreground';

const customizeDescClass = 'text-sm font-normal leading-5 text-muted-foreground';

export interface HomeCustomizeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: string[];
  onReorder: (next: string[]) => void;
  visible: Record<string, boolean>;
  onSetVisible: (id: string, value: boolean) => void;
  sectionTitle: (id: string) => string;
  sectionDescription: (id: string) => string;
  onResetAll: () => void;
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
  "use memo";
  return (
    <div className={customizeCardClass}>
      <div className="min-w-0 space-y-1">
        <Label htmlFor={`home-section-${id}`} className={customizeTitleClass}>
          {title}
        </Label>
        <p className={customizeDescClass}>{description}</p>
      </div>
    </div>
  );
}

function CustomizeSortableRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
  showSwitch,
  disableSortable,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  showSwitch: boolean;
  /** When true, `useSortable` is disabled (no transform from DnD). */
  disableSortable: boolean;
}) {
  "use memo";
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
      className={cn(customizeCardClass, 'flex items-start gap-1', isDragging && 'shadow-md')}
    >
      {disableSortable ? (
        <div className="h-6 w-6 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          className="touch-none shrink-0 cursor-grab rounded-md text-muted-foreground/70 hover:text-muted-foreground active:cursor-grabbing"
          aria-label={`Drag to reorder ${title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-6 w-6" aria-hidden />
        </button>
      )}
      <div className={cn('min-w-0 flex-1 space-y-1', showSwitch && 'pr-2')}>
        <Label htmlFor={`home-section-${id}`} className={customizeTitleClass}>
          {title}
        </Label>
        <p className={customizeDescClass}>{description}</p>
      </div>
      {showSwitch ? (
        <Switch
          id={`home-section-${id}`}
          checked={!!checked}
          onCheckedChange={onCheckedChange}
          className="shrink-0"
        />
      ) : null}
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
  onResetAll,
  dndRemountKey = 0,
}: HomeCustomizeSheetProps) {
  "use memo";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[2.5rem] px-8 pb-8 pt-10">
        <SheetHeader className="space-y-0 px-0 text-center sm:text-center">
          <SheetTitle className="text-sm font-medium leading-5 text-foreground">
            {t('home.customizeSheet.title')}
          </SheetTitle>
        </SheetHeader>

        <SheetDescription className="mt-6 text-left text-base font-medium leading-6 text-foreground">
          {t('home.customizeSheet.description')}
        </SheetDescription>

        <div className="mt-6 space-y-4">
          <section className="space-y-4" aria-labelledby="home-customize-widgets">
            <div className="flex items-center justify-between gap-3">
              <h3 id="home-customize-widgets" className="text-base font-medium leading-6 text-foreground">
                {t('home.customizeSheet.widgetsHeading')}
              </h3>
              <button
                type="button"
                onClick={onResetAll}
                className="shrink-0 text-sm font-medium text-nox-text-link transition-colors hover:text-nox-text-link/80"
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
              <div className="flex flex-col gap-4">
                <CustomizePinnedRow
                  key={GOAL_WHY_SECTION_ID}
                  id={GOAL_WHY_SECTION_ID}
                  title={sectionTitle(GOAL_WHY_SECTION_ID)}
                  description={sectionDescription(GOAL_WHY_SECTION_ID)}
                />
                <SortableContext items={tailOrder} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-4">
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
