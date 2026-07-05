import { PauseDoneCompletionHero } from '@/screens/pause/components/pause-done-completion-hero';

export type PauseDoneBriefOutcomeHeroProps = {
  decision: string | null;
};

/** Brief Done: completion hero (decision appears in Journey summary, not headline). */
export function PauseDoneBriefOutcomeHero(_props: PauseDoneBriefOutcomeHeroProps) {
  "use memo";
  return <PauseDoneCompletionHero />;
}
