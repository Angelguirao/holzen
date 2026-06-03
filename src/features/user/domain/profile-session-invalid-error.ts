/** Thrown when a signed-in JWT has no matching `auth.users` / `profiles` row (stale or wiped DB). */
export class ProfileSessionInvalidError extends Error {
  readonly name = 'ProfileSessionInvalidError';

  constructor(message = 'Session is no longer valid on the server') {
    super(message);
  }
}

export function isProfileSessionInvalidError(error: unknown): error is ProfileSessionInvalidError {
  return error instanceof ProfileSessionInvalidError;
}
