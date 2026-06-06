import { describe, expect, it } from 'vitest';
import { resolveHomeGreetingVariant } from '@/screens/home/lib/home-greeting';

describe('resolveHomeGreetingVariant', () => {
  it('prefers helloName when first name is set', () => {
    expect(resolveHomeGreetingVariant('Angel', false)).toBe('helloName');
    expect(resolveHomeGreetingVariant('Angel', true)).toBe('helloName');
  });

  it('shows welcome on first visit without a name', () => {
    expect(resolveHomeGreetingVariant(null, false)).toBe('welcome');
    expect(resolveHomeGreetingVariant('  ', false)).toBe('welcome');
  });

  it('shows helloAgain on return visits without a name', () => {
    expect(resolveHomeGreetingVariant(null, true)).toBe('helloAgain');
    expect(resolveHomeGreetingVariant(undefined, true)).toBe('helloAgain');
  });
});
