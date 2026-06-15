/**
 * Minimal JWT helpers.
 *
 * The frontend never *verifies* a JWT — it just reads claims so it can derive
 * a `User` and `expiresAt` when the backend response omits them (the current
 * `/api/auth/login` only returns `{ token }`).
 *
 * No external dependency: JWTs are `header.payload.signature` where each part
 * is base64url-encoded JSON. We decode the payload only.
 */

export interface JwtClaims {
  /** Subject — usually the user id. */
  sub?: string;
  /** Email claim (either short or .NET ClaimTypes.Email URI). */
  email?: string;
  /** Issued-at (seconds since epoch). */
  iat?: number;
  /** Expiry (seconds since epoch). */
  exp?: number;
  /** Admin flag — supports a few common claim shapes. */
  is_admin?: boolean;
  isAdmin?: boolean;
  role?: string | string[];
  /** Any other claim (incl. namespaced .NET URIs). */
  [claim: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  // base64url → base64
  let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  // restore padding
  const pad = b64.length % 4;
  if (pad === 2) b64 += '==';
  else if (pad === 3) b64 += '=';
  else if (pad !== 0) throw new Error('Invalid base64url segment');

  // atob → binary string → UTF-8
  const binary = atob(b64);
  // Convert binary string to UTF-8 properly (atob alone doesn't handle non-ASCII).
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

/** Parse the JWT payload. Returns `null` if the token is malformed. */
export function decodeJwt(token: string): JwtClaims | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtClaims;
  } catch {
    return null;
  }
}

/** Pick the email out of standard or .NET-style claim names. */
export function emailFromClaims(claims: JwtClaims | null): string | null {
  if (!claims) return null;
  if (typeof claims.email === 'string') return claims.email;
  const dotnet = claims[
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  ];
  return typeof dotnet === 'string' ? dotnet : null;
}

/** Convert `exp` (seconds) to an ISO timestamp; falls back to 1h from now. */
export function expiresAtFromClaims(claims: JwtClaims | null): string {
  const exp = claims?.exp;
  if (typeof exp === 'number' && Number.isFinite(exp)) {
    return new Date(exp * 1000).toISOString();
  }
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}
