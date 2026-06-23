import { AnyAction, Middleware } from '@reduxjs/toolkit';
import {
  clearAuthError,
} from '../slices/authSlice';
import { clearLeaveMutationError } from '../slices/leavesSlice';
import { clearEmployeeMutationError } from '../slices/employeesSlice';
import {
  clearProfileUpdateState,
  clearPasswordState,
} from '../slices/profileSlice';

const AUTO_DISMISS_MS = 10000; // 10 seconds

// Track pending timers by key so we can clear existing timers when new
// errors arrive for the same slice.
const timers = new Map<string, number>();

function scheduleClear(key: string, cb: () => void) {
  if (timers.has(key)) {
    const id = timers.get(key)!;
    clearTimeout(id);
    timers.delete(key);
  }
  const id = window.setTimeout(() => {
    try {
      cb();
    } finally {
      timers.delete(key);
    }
  }, AUTO_DISMISS_MS) as unknown as number;
  timers.set(key, id);
}

function clearTimer(key: string) {
  if (timers.has(key)) {
    const id = timers.get(key)!;
    clearTimeout(id);
    timers.delete(key);
  }
}

function clearOtherSlices(store: any, current: string) {
  // Immediately clear any other slice-level messages so the latest error
  // replaces what's visible.
  const targets = [
    { key: 'auth', clear: clearAuthError },
    { key: 'leaves', clear: clearLeaveMutationError },
    { key: 'employees', clear: clearEmployeeMutationError },
    { key: 'profile.update', clear: clearProfileUpdateState },
    { key: 'profile.password', clear: clearPasswordState },
  ];

  for (const t of targets) {
    if (t.key === current) continue;
    try {
      store.dispatch(t.clear());
    } catch {
      /* ignore */
    }
    clearTimer(t.key);
  }
}

export const autoDismissErrors: Middleware = (store) => (next) => (action: unknown) => {
  const res = next(action);
  const typedAction = action as AnyAction;

  // Only handle rejected thunks (RTK creates `prefix/rejected` types).
  if (typeof typedAction.type === 'string' && typedAction.type.endsWith('/rejected')) {
    const parts = typedAction.type.split('/');
    const slice = parts[0];

    // Clear other slices immediately so the latest message replaces any
    // previously-displayed message.
    clearOtherSlices(store, slice);

    switch (slice) {
      case 'auth':
        scheduleClear('auth', () => store.dispatch(clearAuthError()));
        break;
      case 'leaves':
        scheduleClear('leaves', () => store.dispatch(clearLeaveMutationError()));
        break;
      case 'employees':
        scheduleClear('employees', () => store.dispatch(clearEmployeeMutationError()));
        break;
      case 'profile':
        if (typedAction.type.startsWith('profile/update')) {
          scheduleClear('profile.update', () => store.dispatch(clearProfileUpdateState()));
        } else if (typedAction.type.startsWith('profile/changePassword')) {
          scheduleClear('profile.password', () => store.dispatch(clearPasswordState()));
        }
        break;
      default:
        break;
    }
  }

  return res;
};

export default autoDismissErrors;
