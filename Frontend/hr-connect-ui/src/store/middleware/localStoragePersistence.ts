import type { Middleware } from '@reduxjs/toolkit';
import type { User } from '../../types/auth';

const STORAGE_KEY = 'hrconnect.auth.v1';

interface PersistedAuth {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
}

export function loadAuthFromStorage(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    // Drop expired tokens at hydration time.
    if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthToStorage(snapshot: PersistedAuth) {
  try {
    if (!snapshot.token) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota exceeded / privacy mode — ignore */
  }
}

/**
 * Mirrors the slice's `{ user, token, expiresAt }` to localStorage after every
 * action so a page reload preserves the session (architecture §10, ADR-0005).
 */
export const localStoragePersistence: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState() as { auth?: PersistedAuth };
  if (state.auth) {
    saveAuthToStorage({
      user: state.auth.user ?? null,
      token: state.auth.token ?? null,
      expiresAt: state.auth.expiresAt ?? null,
    });
  }
  return result;
};
