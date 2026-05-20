import { Anchor, BookOpenText, Clock, Feather, Mountain } from 'lucide-react';

/** Icons for inline `CompanionSection` card headers. */
export const COMPANION_SECTION_ICONS: Record<string, React.ElementType> = {
  haiku: Feather,
  grounding: Anchor,
  signal: BookOpenText,
  zoomOut: Mountain,
  history: Clock,
};
