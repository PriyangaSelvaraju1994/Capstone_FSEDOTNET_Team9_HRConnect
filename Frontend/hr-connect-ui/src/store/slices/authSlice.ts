import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import { ApiError } from '../../api/client';
import type {
  AuthErrorPayload,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../../types/auth';
import { loadAuthFromStorage } from '../middleware/localStoragePersistence';

type AuthStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthState {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  status: AuthStatus;
  error: AuthErrorPayload | null;
}

const hydrated = loadAuthFromStorage();

const initialState: AuthState = {
  user: hydrated?.user ?? null,
  token: hydrated?.token ?? null,
  expiresAt: hydrated?.expiresAt ?? null,
  status: 'idle',
  error: null,
};

function toErrorPayload(err: unknown): AuthErrorPayload {
  if (err instanceof ApiError) {
    const field = err.payload.field as AuthErrorPayload['field'] | undefined;
    return { message: err.payload.message, field };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: 'Something went wrong. Please try again.' };
}

// --- Thunks ----------------------------------------------------------------

export const loginThunk = createAsyncThunk<
  AuthResponse,
  LoginRequest,
  { rejectValue: AuthErrorPayload }
>('auth/login', async (req, { rejectWithValue }) => {
  try {
    return await authApi.login(req);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const registerThunk = createAsyncThunk<
  AuthResponse,
  RegisterRequest,
  { rejectValue: AuthErrorPayload }
>('auth/register', async (req, { rejectWithValue }) => {
  try {
    return await authApi.register(req);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

// --- Slice -----------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.expiresAt = null;
      state.status = 'idle';
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
      if (state.status === 'failed') state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AuthState) => {
      state.status = 'loading';
      state.error = null;
    };
    const handleFulfilled = (
      state: AuthState,
      action: PayloadAction<AuthResponse>,
    ) => {
      state.status = 'succeeded';
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.error = null;
    };
    const handleRejected = (
      state: AuthState,
      action: PayloadAction<AuthErrorPayload | undefined>,
    ) => {
      state.status = 'failed';
      state.error =
        action.payload ?? { message: 'Authentication failed.' };
    };

    builder
      .addCase(loginThunk.pending, handlePending)
      .addCase(loginThunk.fulfilled, handleFulfilled)
      .addCase(loginThunk.rejected, handleRejected)
      .addCase(registerThunk.pending, handlePending)
      .addCase(registerThunk.fulfilled, handleFulfilled)
      .addCase(registerThunk.rejected, handleRejected);
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// --- Selectors -------------------------------------------------------------

import type { RootState } from '../store';

export const selectAuthUser = (s: RootState) => s.auth.user;
export const selectAuthToken = (s: RootState) => s.auth.token;
export const selectIsAuthenticated = (s: RootState) => Boolean(s.auth.token);
export const selectIsAdmin = (s: RootState) => s.auth.user?.isAdmin === true;
export const selectAuthStatus = (s: RootState) => s.auth.status;
export const selectAuthError = (s: RootState) => s.auth.error;

export default authSlice.reducer;
