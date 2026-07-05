import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CompanionOrchestratedCard } from './companion-orchestrated-card';

vi.mock('@/screens/pause/components/companion/companion-orchestrated-slot-chrome', () => ({
  CompanionOrchestratedSlotChrome: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="slot-chrome">{children}</div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function baseProps(overrides: Record<string, unknown> = {}) {
  return {
    id: 'grounding',
    label: 'Ground yourself',
    icon: () => null,
    expanded: false,
    onToggleExpand: vi.fn(),
    completed: false,
    onFirstExpandComplete: vi.fn(),
    loading: false,
    pauseInstanceId: 'pause-1',
    hasContent: false,
    relaxationKey: null,
    companionType: 'grounding',
    cacheId: null,
    regenerateSlot: 'grounding' as const,
    onRegenerate: vi.fn(),
    routeSegment: 'grounding' as const,
    children: <p>Body</p>,
    ...overrides,
  };
}

describe('CompanionOrchestratedCard', () => {
  it('does not mark seen on expand while content is still missing', () => {
    const onFirstExpandComplete = vi.fn();
    const onToggleExpand = vi.fn();

    render(
      <CompanionOrchestratedCard
        {...baseProps({
          onFirstExpandComplete,
          onToggleExpand,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ground yourself/i }));

    expect(onToggleExpand).toHaveBeenCalled();
    expect(onFirstExpandComplete).not.toHaveBeenCalled();
  });

  it('marks seen only after expanded with displayable content', () => {
    const onFirstExpandComplete = vi.fn();

    const { rerender } = render(
      <CompanionOrchestratedCard
        {...baseProps({
          expanded: true,
          loading: true,
          onFirstExpandComplete,
        })}
      />,
    );

    expect(onFirstExpandComplete).not.toHaveBeenCalled();

    rerender(
      <CompanionOrchestratedCard
        {...baseProps({
          expanded: true,
          loading: false,
          hasContent: true,
          onFirstExpandComplete,
        })}
      />,
    );

    expect(onFirstExpandComplete).toHaveBeenCalledTimes(1);
  });
});
