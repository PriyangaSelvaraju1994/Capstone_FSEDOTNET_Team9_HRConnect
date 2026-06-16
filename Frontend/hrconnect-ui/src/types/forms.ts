/**
 * Shared form value types used across the application.
 * These represent the shape of data in forms, including validation requirements.
 */

/** Profile update form values */
export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone?: string;
}

/** Password change form values */
export interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
