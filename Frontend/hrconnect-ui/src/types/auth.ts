export type Department = 'IT' | 'QE' | 'Sales' | 'HR';
export type Designation = 'Software Engineer' | 'QA' | 'Finance' | 'Engineer' | 'Architect';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  joiningDate?: string;
  department?: Department;
  designation?: Designation;
  isAdmin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  joiningDate: string;
  department: Department;
  designation: Designation;
}

export interface RegisterResponse {
  message: string;
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
