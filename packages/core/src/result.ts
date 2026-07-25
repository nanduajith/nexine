/**
 * A tiny Result type so tool transforms can report failure without throwing.
 * Pure functions returning Result are trivial to unit-test and let the UI render
 * errors as data rather than catching exceptions.
 */
export type Result<T, E = string> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
