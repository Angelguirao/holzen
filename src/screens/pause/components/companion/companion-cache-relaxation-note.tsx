import { useTranslation } from 'react-i18next';

export type CompanionCacheRelaxationNoteProps = {
  relaxationKey: string | null | undefined;
};

/** Small mono status when a companion slot was served from a relaxed cache rule. */
export function CompanionCacheRelaxationNote({ relaxationKey }: CompanionCacheRelaxationNoteProps) {
  const { t } = useTranslation();
  if (!relaxationKey) return null;

  return (
    <p
      className="mt-2 px-0.5 font-mono text-[10px] leading-snug text-muted-foreground/55"
      role="status"
    >
      {t(`companions.cacheRelaxation.${relaxationKey}`)}
    </p>
  );
}
