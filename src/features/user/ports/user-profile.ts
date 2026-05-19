/** Port for profile row reads/writes — implement when profile queries leave `src/lib`. */
export interface UserProfilePort {
  readonly _brand?: 'UserProfilePort';
}
