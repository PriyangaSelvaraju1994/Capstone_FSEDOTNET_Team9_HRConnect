/**
 * Auth API client.
 *
 * Talks to the HRConnect backend via the shared axios instance (`./client`).
 * Endpoints follow ADR-0004 (JWT bearer auth).
 *
 * The backend currently returns `{ token }` for `/auth/login`. The frontend
 * contract is `{ accessToken, expiresAt, user }`, so `normaliseAuthResponse`
 * adapts whichever shape comes back into the typed `AuthResponse` the auth
 * slice expects. Once the backend returns the full envelope, this adapter is
 * a no-op.
 */
import { http } from './client';
import type {
  AuthResponse,
  Department,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';
import {
  decodeJwt,
  emailFromClaims,
  expiresAtFromClaims,
} from '../utils/jwt';

interface RawAuthResponse {
  accessToken?: string;
  token?: string;
  expiresAt?: string;
  user?: Partial<User>;
  fullName?: string;
  isAdmin?: boolean;
  department?: Department;
}

function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const [first, ...rest] = trimmed.split(/\s+/);
  return { firstName: first, lastName: rest.join(' ') };
}

function userFromEmail(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) =>
    s.length === 0 ? s : s[0].toUpperCase() + s.slice(1).toLowerCase();
  const firstName = cap(parts[0] ?? local);
  const lastName = parts.slice(1).map(cap).join(' ');
  return { firstName, lastName };
}

function normaliseAuthResponse(
  raw: RawAuthResponse,
  fallbackEmail?: string,
): AuthResponse {
  const accessToken = raw.accessToken ?? raw.token;
  if (!accessToken) {
    throw new Error('Auth response did not include a token.');
  }

  const claims = decodeJwt(accessToken);
  const email =
    raw.user?.email ?? emailFromClaims(claims) ?? fallbackEmail ?? '';

  const expiresAt = raw.expiresAt ?? expiresAtFromClaims(claims);

  let firstName = raw.user?.firstName ?? '';
  let lastName = raw.user?.lastName ?? '';
  if (!firstName && !lastName) {
    if (raw.fullName) {
      const split = splitName(raw.fullName);
      firstName = split.firstName;
      lastName = split.lastName;
    } else if (email) {
      const derived = userFromEmail(email);
      firstName = derived.firstName;
      lastName = derived.lastName;
    }
  }

  const isAdmin =
    raw.user?.isAdmin ??
    raw.isAdmin ??
    (typeof claims?.is_admin === 'boolean' ? claims.is_admin : undefined) ??
    (typeof claims?.isAdmin === 'boolean' ? claims.isAdmin : undefined) ??
    false;

  const department: Department =
    raw.user?.department ?? raw.department ?? 'Engineering';

  const id = raw.user?.id ?? (typeof claims?.sub === 'string' ? claims.sub : email);

  const user: User = {
    id,
    firstName,
    lastName,
    email,
    department,
    isAdmin,
  };

  return { accessToken, expiresAt, user };
}

export const authApi = {
  login(req: LoginRequest): Promise<AuthResponse> {
    return http
      .post<RawAuthResponse>('/auth/login', req)
      .then((r) => normaliseAuthResponse(r.data, req.email));
  },

  register(req: RegisterRequest): Promise<AuthResponse> {
    return http
      .post<RawAuthResponse>('/auth/register', req)
      .then((r) => normaliseAuthResponse(r.data, req.email));
  },

  logout(): Promise<void> {
    return http.post<void>('/auth/logout').then(() => undefined);
  },
};
