/**
 * Tiny shared helpers used by every feature slice.
 *
 * Every slice in this app follows the same RTK-thunk lifecycle, so we extract
 * the type alias + the error normalisation helper here to keep the slices
 * focused on their domain logic.
 */

/** Standard async lifecycle states for a thunk-backed slot. */
export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * Convert any thrown value into a user-facing string. Always returns a
 * non-empty string so reducers can store `error: string | null` safely.
 */
export function toMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}
