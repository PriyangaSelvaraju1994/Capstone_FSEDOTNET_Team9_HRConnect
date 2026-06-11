/**
 * Auth API client.
 *
 * Talks to the HRConnect backend via the shared axios instance (`./client`).
 * Endpoints follow ADR-0004 (JWT bearer auth).
 */
import { http } from './client';
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth';

export const authApi = {
  login(req: LoginRequest): Promise<AuthResponse> {
    return http.post<AuthResponse>('/auth/login', req).then((r) => r.data);
  },

  register(req: RegisterRequest): Promise<AuthResponse> {
    return http
      .post<AuthResponse>('/auth/register', req)
      .then((r) => r.data);
  },

  logout(): Promise<void> {
    return http.post<void>('/auth/logout').then(() => undefined);
  },
};
