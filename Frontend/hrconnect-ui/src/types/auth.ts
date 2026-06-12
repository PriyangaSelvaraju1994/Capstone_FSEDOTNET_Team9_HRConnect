export type Department = 'Engineering' | 'Design' | 'Sales' | 'HR';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: Department;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string; // ISO timestamp
  user: User;
}

/**
 * Shape of the error a failed auth thunk rejects with.
 * Matches the architecture's error envelope (architecture §10) so the same
 * UI can render mock errors and real server errors identically.
 */
export interface AuthErrorPayload {
  message: string;
  field?: 'email' | 'password' | 'firstName' | 'lastName' | 'department';
}
