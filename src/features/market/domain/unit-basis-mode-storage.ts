const UNIT_BASIS_MODE_STORAGE_KEY = 'holzen_unit_basis_mode';
const LEGACY_UNIT_BASIS_MODE_STORAGE_KEY = 'holzen_btc_mode';

export function readUnitBasisModeFromStorage(): boolean {
  try {
    const canonical = localStorage.getItem(UNIT_BASIS_MODE_STORAGE_KEY);
    if (canonical !== null) return canonical === 'true';

    const legacy = localStorage.getItem(LEGACY_UNIT_BASIS_MODE_STORAGE_KEY);
    if (legacy !== null) {
      localStorage.setItem(UNIT_BASIS_MODE_STORAGE_KEY, legacy);
      return legacy === 'true';
    }
  } catch {
    /* localStorage unavailable */
  }
  return false;
}

export function writeUnitBasisModeToStorage(enabled: boolean): void {
  try {
    localStorage.setItem(UNIT_BASIS_MODE_STORAGE_KEY, String(enabled));
  } catch {
    /* localStorage unavailable */
  }
}
