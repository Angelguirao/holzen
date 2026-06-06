import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CirclePlus, Pencil } from 'lucide-react';
import { useProfile } from '@/features/user/public-hooks';
import { formatMotivationLine } from '@/features/user/domain/profile-motivations';
import { AddAnchorDialog } from '@/screens/home/components/AddAnchorDialog';
import { GoalWhyEditSheet } from '@/screens/home/components/GoalWhyEditSheet';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

/**
 * Home anchor card (Wireframes 2.1 Full / 2.2 Sin anchor): optional mantra + motivations line.
 */
export function HomeGoalWhyCard() {
  "use memo";
  const { t } = useTranslation();
  const { motivations, mantra, setMotivations, setMantra } = useProfile();
  const [addAnchorOpen, setAddAnchorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const mantraLine = mantra?.trim() ?? '';

  const motivationLine = useMemo(
    () =>
      formatMotivationLine(motivations, (id) =>
        t(`settings.motivations.${id}`, id),
      ),
    [motivations, t],
  );

  const openAddAnchor = () => setAddAnchorOpen(true);

  return (
    <>
      <div className={cn('rounded-lg border border-border/40 bg-card/40 p-4')}>
        <div className="flex items-start justify-between gap-3">
          {mantraLine ? (
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground">
              {`"${mantraLine}"`}
            </p>
          ) : (
            <button
              type="button"
              onClick={openAddAnchor}
              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-primary"
            >
              <CirclePlus className="h-5 w-5 shrink-0" aria-hidden />
              <span>{t('home.goalWhy.addAnchorCta', { defaultValue: 'Add your anchor' })}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className={homeInWidget.iconBtn}
            aria-label={t('home.goalWhy.editWhys')}
          >
            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>

        {motivationLine ? (
          <p className="pt-2 text-xs font-medium italic tracking-wide text-muted-foreground">
            {motivationLine}
          </p>
        ) : null}
      </div>

      <AddAnchorDialog
        open={addAnchorOpen}
        onOpenChange={setAddAnchorOpen}
        initialValue={mantraLine}
        onSave={async (nextMantra) => {
          await setMantra(nextMantra);
        }}
      />

      <GoalWhyEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        mantra={mantra}
        motivations={motivations}
        onSave={async ({ mantra: nextMantra, motivations: nextMotivations }) => {
          await Promise.all([setMantra(nextMantra), setMotivations(nextMotivations)]);
        }}
      />
    </>
  );
}
