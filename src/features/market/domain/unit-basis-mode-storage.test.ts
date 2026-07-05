import { beforeEach, describe, expect, it } from 'vitest';
import { readUnitBasisModeFromStorage, writeUnitBasisModeToStorage } from './unit-basis-mode-storage';

describe('unit-basis-mode-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when unset', () => {
    expect(readUnitBasisModeFromStorage()).toBe(false);
  });

  it('reads canonical holzen_unit_basis_mode', () => {
    localStorage.setItem('holzen_unit_basis_mode', 'true');
    expect(readUnitBasisModeFromStorage()).toBe(true);
  });

  it('migrates legacy holzen_btc_mode to canonical key', () => {
    localStorage.setItem('holzen_btc_mode', 'true');
    expect(readUnitBasisModeFromStorage()).toBe(true);
    expect(localStorage.getItem('holzen_unit_basis_mode')).toBe('true');
  });

  it('prefers canonical over legacy', () => {
    localStorage.setItem('holzen_btc_mode', 'true');
    localStorage.setItem('holzen_unit_basis_mode', 'false');
    expect(readUnitBasisModeFromStorage()).toBe(false);
  });

  it('writes canonical key only', () => {
    writeUnitBasisModeToStorage(true);
    expect(localStorage.getItem('holzen_unit_basis_mode')).toBe('true');
  });
});
