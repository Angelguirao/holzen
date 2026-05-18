/** Port for auth session — implement when `use-auth` infrastructure is split from React provider. */
export interface AuthSessionPort {
  readonly _brand?: 'AuthSessionPort';
}
