import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

/** Vertical rhythm inside pause widget bodies (Figma gap-16). */
export const homePauseWidgetBodyStack = 'flex flex-col gap-4';

type NoxCtaProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Nox primary pill CTA (Figma Pills / `ctaNoxPrimary`). */
export function HomePauseWidgetNoxCta({ label, onClick, disabled }: NoxCtaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(homeInWidget.ctaNoxPrimary, 'h-10 border-0 shadow-none disabled:opacity-60')}
    >
      {label}
    </button>
  );
}

type DiscardProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Centered primary-text discard (Figma 555:18870). */
export function HomePauseWidgetDiscardLink({ label, onClick, disabled }: DiscardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-1 text-center text-sm font-medium text-primary transition-colors hover:text-primary/90 disabled:opacity-60"
    >
      {label}
    </button>
  );
}

type TwoToneLeadProps = {
  lead: string;
  tail: string;
};

/** Mid-ritual status copy (Figma 555:18865 — 14px two-tone). */
export function HomePauseWidgetTwoToneLead({ lead, tail }: TwoToneLeadProps) {
  return (
    <p className="text-sm leading-5 tracking-wide">
      <span className="text-foreground">{lead}</span>{' '}
      <span className="text-muted-foreground">{tail}</span>
    </p>
  );
}

type OpeningStackProps = {
  children: ReactNode;
};

/** Opening empathy + inline market block (Figma 559:26764). */
export function HomePauseWidgetOpeningStack({ children }: OpeningStackProps) {
  return <div className="space-y-0 text-sm leading-5 tracking-wide">{children}</div>;
}
