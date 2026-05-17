import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PauseSessionGate } from '@/components/pause/PauseSessionGate';
import '@/i18n';

describe('F3 — Pause ritual shell', () => {
  it('shows empty shell copy when no session (no /tools links)', () => {
    const onReturn = vi.fn();
    render(
      <PauseSessionGate
        shellReady={false}
        phase="session"
        waitingForFetch={false}
        fetchFailed={false}
        hydrationStatus="empty"
        profileLoaded
        onReturn={onReturn}
      >
        <div data-testid="ritual-body">Ritual</div>
      </PauseSessionGate>,
    );

    expect(screen.getByText(/no pause to open/i)).toBeInTheDocument();
    expect(screen.getByText(/i need a pause/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tools/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /return/i }));
    expect(onReturn).toHaveBeenCalledTimes(1);
  });

  it('renders ritual children when shell is ready', () => {
    render(
      <PauseSessionGate
        shellReady
        phase="session"
        waitingForFetch={false}
        fetchFailed={false}
        hydrationStatus="ready"
        profileLoaded
        onReturn={vi.fn()}
      >
        <div data-testid="ritual-body">Feel step</div>
      </PauseSessionGate>,
    );

    expect(screen.getByTestId('ritual-body')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /tools/i })).not.toBeInTheDocument();
  });
});
