/**
 * Profile data layer — the S10 page reads/updates the signed-in user's
 * personal info (firstName, lastName, phone) and password.
 */
import { http, ApiError } from './client';
import type { Employee } from '../types/employee';

export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
}

/**
 * Re-exported so existing callers (ProfilePage) keep working without touching
 * the shared client directly. Backed by `ApiError.payload.field`.
 */
export class PasswordChangeError extends Error {
  constructor(
    message: string,
    public readonly field?: 'currentPassword' | 'newPassword',
  ) {
    super(message);
    this.name = 'PasswordChangeError';
  }
}

function toPasswordError(err: unknown): PasswordChangeError {
  if (err instanceof ApiError) {
    const field =
      err.payload.field === 'currentPassword' ||
      err.payload.field === 'newPassword'
        ? err.payload.field
        : undefined;
    return new PasswordChangeError(err.payload.message, field);
  }
  if (err instanceof Error) return new PasswordChangeError(err.message);
  return new PasswordChangeError('Could not change password.');
}

export const profileApi = {
  get(): Promise<Employee> {
    return http.get<Employee>('/me').then((r) => r.data);
  },

  update(payload: ProfileUpdatePayload): Promise<Employee> {
    return http.patch<Employee>('/me', payload).then((r) => r.data);
  },

  async changePassword(payload: PasswordChangePayload): Promise<void> {
    try {
      await http.post<void>('/me/password', payload);
    } catch (err) {
      throw toPasswordError(err);
    }
  },
};
