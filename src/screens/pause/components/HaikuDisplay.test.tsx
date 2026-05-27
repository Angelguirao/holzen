import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HaikuDisplay, parseHaikuLines } from '@/screens/pause/components/HaikuDisplay';

describe('parseHaikuLines', () => {
  it('splits on newlines and escaped newlines', () => {
    expect(parseHaikuLines('Line one\nLine two\nLine three')).toEqual([
      'Line one',
      'Line two',
      'Line three',
    ]);
    expect(parseHaikuLines('A\\nB\\nC')).toEqual(['A', 'B', 'C']);
  });
});

describe('HaikuDisplay', () => {
  it('renders each line as its own paragraph', () => {
    render(<HaikuDisplay haiku="The tide pulls away\nShadows grow in silence\nBreath remains your own" variant="verse" />);
    expect(screen.getByText('The tide pulls away')).toBeTruthy();
    expect(screen.getByText('Shadows grow in silence')).toBeTruthy();
    expect(screen.getByText('Breath remains your own')).toBeTruthy();
  });
});
