import type { Middleware } from '@reduxjs/toolkit';
import type { User } from '../../types/auth';

const STORAGE_KEY = 'hrconnect.auth.v1';

interface PersistedAuth {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
}

export function loadAuthFromSessionStorage(): PersistedAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    // Drop expired tokens at hydration time.
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthToSessionStorage(snapshot: PersistedAuth) {
  try {
    if (!snapshot.token) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota exceeded / privacy mode — ignore */
  }
}

/**
 * Mirrors the slice's `{ user, token, expiresAt }` to sessionStorage after
 * every action so state is kept for the current browser session only.
 */
export const sessionStoragePersistence: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState() as { auth?: PersistedAuth };
  if (state.auth) {
    saveAuthToSessionStorage({
      user: state.auth.user ?? null,
      token: state.auth.token ?? null,
      expiresAt: state.auth.expiresAt ?? null,
    });
  }
  return result;
};
