/**
 * Profile slice (S10) — the signed-in user's editable personal info plus
 * the password-change flow. Auth identity stays in authSlice; this slice
 * holds the wider Employee record (phone, designation, joining date, ...).
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { profileApi, PasswordChangeError } from '../../api/profileApi';
import type {
  PasswordChangePayload,
  ProfileUpdatePayload,
} from '../../api/profileApi';
import type { Employee } from '../../types/employee';
import { toMessage, type AsyncStatus } from '../asyncStatus';

// --- State -----------------------------------------------------------------

export interface ProfileState {
  data: Employee | null;
  status: AsyncStatus;
  error: string | null;
  updateStatus: AsyncStatus;
  updateError: string | null;
  passwordStatus: AsyncStatus;
  passwordError: string | null;
  passwordErrorField: 'currentPassword' | 'newPassword' | null;
}

const initialState: ProfileState = {
  data: null,
  status: 'idle',
  error: null,
  updateStatus: 'idle',
  updateError: null,
  passwordStatus: 'idle',
  passwordError: null,
  passwordErrorField: null,
};

// --- Thunks ----------------------------------------------------------------

export const fetchProfile = createAsyncThunk<
  Employee,
  string,
  { rejectValue: string }
>('profile/fetch', async (_userId, { rejectWithValue }) => {
  try {
    return await profileApi.get();
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load your profile.'));
  }
});

export const updateProfile = createAsyncThunk<
  Employee,
  { userId: string; payload: ProfileUpdatePayload },
  { rejectValue: string }
>('profile/update', async ({ payload }, { rejectWithValue }) => {
  try {
    return await profileApi.update(payload);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not save your profile.'));
  }
});

export interface ChangePasswordRejection {
  message: string;
  field: 'currentPassword' | 'newPassword' | null;
}

export const changePassword = createAsyncThunk<
  void,
  PasswordChangePayload,
  { rejectValue: ChangePasswordRejection }
>('profile/changePassword', async (payload, { rejectWithValue }) => {
  try {
    await profileApi.changePassword(payload);
  } catch (err) {
    if (err instanceof PasswordChangeError) {
      return rejectWithValue({ message: err.message, field: err.field ?? null });
    }
    return rejectWithValue({
      message: toMessage(err, 'Could not change your password.'),
      field: null,
    });
  }
});

// --- Slice -----------------------------------------------------------------

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileUpdateState(state) {
      state.updateStatus = 'idle';
      state.updateError = null;
    },
    clearPasswordState(state) {
      state.passwordStatus = 'idle';
      state.passwordError = null;
      state.passwordErrorField = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetch
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Could not load your profile.';
      })

      // --- update
      .addCase(updateProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.data = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload ?? 'Could not save your profile.';
      })

      // --- change password
      .addCase(changePassword.pending, (state) => {
        state.passwordStatus = 'loading';
        state.passwordError = null;
        state.passwordErrorField = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordStatus = 'succeeded';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordStatus = 'failed';
        state.passwordError =
          action.payload?.message ?? 'Could not change your password.';
        state.passwordErrorField = action.payload?.field ?? null;
      });
  },
});

export const { clearProfileUpdateState, clearPasswordState } =
  profileSlice.actions;

// --- Selectors -------------------------------------------------------------

import type { RootState } from '../store';

export const selectProfile = (s: RootState) => s.profile;

export default profileSlice.reducer;
