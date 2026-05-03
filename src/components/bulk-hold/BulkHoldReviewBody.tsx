import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BulkHoldPauseRow } from '@/components/bulk-hold/BulkHoldPauseRow';
import type { BulkHoldOutcomeChoice, BulkHoldReviewSection } from '@/lib/bulk-hold';

interface BulkHoldReviewBodyProps {
  sections: BulkHoldReviewSection[];
  draftOutcomes: Record<string, BulkHoldOutcomeChoice>;
  onOutcomeChange: (pauseId: string, outcome: BulkHoldOutcomeChoice) => void;
  onOpenArchive: () => void;
}

export function BulkHoldReviewBody({ sections, draftOutcomes, onOutcomeChange, onOpenArchive }: BulkHoldReviewBodyProps) {
  const { t, i18n } = useTranslation();

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="space-y-6 pt-2"
    >
      {sections.map((section) => (
        <div key={section.label} className="space-y-3">
          <p className="text-base font-medium text-foreground">{section.label}</p>
          <div className="flex flex-col gap-4">
            {section.items.map((p) => (
              <BulkHoldPauseRow
                key={p.id}
                pause={p}
                language={i18n.language}
                value={draftOutcomes[p.id]}
                onValueChange={onOutcomeChange}
              />
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onOpenArchive}
        className="text-xs font-medium text-primary underline underline-offset-4"
      >
        {t('bulkHold.openArchiveFullDetail', { defaultValue: 'Open Archive for full detail' })}
      </button>
    </motion.div>
  );
}
