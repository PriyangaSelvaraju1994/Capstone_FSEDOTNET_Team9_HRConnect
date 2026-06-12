import seed from './users.json';
import type {
  AuthErrorPayload,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../types/auth';

interface SeedUser extends User {
  password: string;
}

// In-memory mutable copy of the seed. Persists for the lifetime of the tab.
const users: SeedUser[] = (seed as SeedUser[]).map((u) => ({ ...u }));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeJwt(user: User): string {
  // Resembles a JWT shape (header.payload.signature) but is NOT signed.
  // The backend will issue real HS256 tokens; the frontend only needs to
  // pass them back in Authorization headers and read the payload claims.
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      is_admin: user.isAdmin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 60 min, matches ADR-0005
    }),
  );
  return `${header}.${payload}.mock-signature`;
}

function toUser(u: SeedUser): User {
  return {
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    department: u.department,
    isAdmin: u.isAdmin,
  };
}

function buildAuthResponse(user: User): AuthResponse {
  return {
    accessToken: fakeJwt(user),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user,
  };
}

class MockAuthError extends Error {
  payload: AuthErrorPayload;
  constructor(payload: AuthErrorPayload) {
    super(payload.message);
    this.payload = payload;
  }
}

export const mockAuth = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    await sleep(450);
    const found = users.find(
      (u) => u.email.toLowerCase() === req.email.trim().toLowerCase(),
    );
    if (!found || found.password !== req.password) {
      throw new MockAuthError({
        message: 'Invalid email or password.',
      });
    }
    return buildAuthResponse(toUser(found));
  },

  async register(req: RegisterRequest): Promise<AuthResponse> {
    await sleep(600);
    const exists = users.some(
      (u) => u.email.toLowerCase() === req.email.trim().toLowerCase(),
    );
    if (exists) {
      throw new MockAuthError({
        message: 'An account with this email already exists.',
        field: 'email',
      });
    }
    const newUser: SeedUser = {
      id: `u-${String(users.length + 1).padStart(3, '0')}`,
      firstName: req.firstName.trim(),
      lastName: req.lastName.trim(),
      email: req.email.trim().toLowerCase(),
      password: req.password,
      department: req.department,
      isAdmin: false,
    };
    users.push(newUser);
    return buildAuthResponse(toUser(newUser));
  },
};

export { MockAuthError };
