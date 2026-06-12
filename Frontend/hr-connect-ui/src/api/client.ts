/**
 * Shared HTTP client.
 *
 * One axios instance for the whole app:
 * - Base URL comes from `VITE_API_BASE_URL` (see .env / .env.example),
 *   defaulting to `/api` so the Vite proxy keeps working in dev.
 * - A request interceptor injects `Authorization: Bearer <token>` using a
 *   getter that the store registers at startup via `attachAuthToken()`.
 *   Reading the token through a getter (instead of importing the store) keeps
 *   this module free of React/Redux imports and prevents circular deps.
 * - A response interceptor unwraps the backend error envelope into a typed
 *   `ApiError` and, on 401, notifies a registered handler so the auth slice
 *   can dispatch `logout()` without `client.ts` importing it.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(
  /\/$/,
  '',
);

/** Shape of the backend error envelope (architecture §10). */
export interface ApiErrorPayload {
  message: string;
  /** Optional form field that the error applies to (e.g. 'email'). */
  field?: string;
  /** Optional machine-readable code (e.g. 'EMAIL_TAKEN'). */
  code?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

// --- Auth wiring -----------------------------------------------------------

type TokenGetter = () => string | null | undefined;
type UnauthorizedHandler = () => void;

let tokenGetter: TokenGetter = () => null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Called once from `main.tsx` after the Redux store is created:
 * `attachAuthToken(() => store.getState().auth.token)`.
 */
export function attachAuthToken(getter: TokenGetter): void {
  tokenGetter = getter;
}

/**
 * Called once from `main.tsx`:
 * `onUnauthorized(() => store.dispatch(logout()))`.
 */
export function onUnauthorized(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

// --- Axios instance --------------------------------------------------------

export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenGetter();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      try {
        unauthorizedHandler();
      } catch {
        /* never let the logout side effect mask the original error */
      }
    }
    throw toApiError(error);
  },
);

function toApiError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as unknown;

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const message =
      typeof obj.message === 'string'
        ? obj.message
        : typeof obj.title === 'string'
          ? obj.title
          : error.message || 'Request failed';
    const field = typeof obj.field === 'string' ? obj.field : undefined;
    const code = typeof obj.code === 'string' ? obj.code : undefined;
    return new ApiError(status, { message, field, code });
  }

  return new ApiError(status, {
    message: error.message || 'Network error. Please try again.',
  });
}
