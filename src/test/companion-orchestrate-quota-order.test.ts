import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'supabase/functions/companion-orchestrate/index.ts'), 'utf8');

function indexOfOrThrow(snippet: string): number {
  const idx = source.indexOf(snippet);
  if (idx === -1) {
    throw new Error(`Expected snippet not found: ${snippet}`);
  }
  return idx;
}

describe('companion-orchestrate premium quota ordering', () => {
  it('only consumes premium companion allowance after non-generation exits are bypassed', () => {
    const skipCache = indexOfOrThrow('const skipped = await tryOrchestrateSkipFromPauseArtifacts');
    const rateLimit = indexOfOrThrow('const rateLimit = await checkRateLimit');
    const panicMode = indexOfOrThrow('panic mode active');
    const budget = indexOfOrThrow('const budget = await checkCostCeilings');
    const quota = indexOfOrThrow('const quota = await consumeAllowanceOrCredits');
    const questionGeneration = indexOfOrThrow('const questionPromise =');
    const companionGeneration = indexOfOrThrow('const tasks = buildOrchestrateCompanionTasks');

    expect(quota).toBeGreaterThan(skipCache);
    expect(quota).toBeGreaterThan(rateLimit);
    expect(quota).toBeGreaterThan(panicMode);
    expect(quota).toBeGreaterThan(budget);
    expect(quota).toBeLessThan(questionGeneration);
    expect(quota).toBeLessThan(companionGeneration);
  });
});
