/**
 * Dashboard slice — owns the two dashboard payloads (S1 employee, S2 HR).
 * Both screens dispatch a thunk on mount and read state via selectors.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardApi } from '../../api/dashboardApi';
import type {
  EmployeeDashboardData,
  HrActivityEntry,
  HrDashboardSummary,
} from '../../types/leave';
import { toMessage, type AsyncStatus } from '../asyncStatus';

// --- State -----------------------------------------------------------------

interface Slot<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
}

export interface DashboardState {
  employee: Slot<EmployeeDashboardData[]> & { forUserId: number | null };
  hr: Slot<HrDashboardSummary>;
  hrRecent: Slot<HrActivityEntry[]>;
}

const initialState: DashboardState = {
  employee: { data: null, status: 'idle', error: null, forUserId: null },
  hr: { data: null, status: 'idle', error: null },
  hrRecent: { data: null, status: 'idle', error: null },
};

// --- Thunks ----------------------------------------------------------------

export const fetchEmployeeDashboard = createAsyncThunk<
  EmployeeDashboardData[],
  number,
  { rejectValue: string }
>('dashboard/fetchEmployee', async (userId, { rejectWithValue }) => {
  try {
    return await dashboardApi.getEmployeeDashboard(userId);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load your dashboard.'));
  }
});

export const fetchHrDashboard = createAsyncThunk<
  HrDashboardSummary,
  void,
  { rejectValue: string }
>('dashboard/fetchHr', async (_, { rejectWithValue }) => {
  try {
    return await dashboardApi.getHrDashboard();
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load HR metrics.'));
  }
});

export const fetchHrDashboardRecent = createAsyncThunk<
  HrActivityEntry[],
  void,
  { rejectValue: string }
>('dashboard/fetchHrRecent', async (_, { rejectWithValue }) => {
  try {
    return await dashboardApi.getHrDashboardRecent();
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load recent HR activities.'));
  }
});

// --- Slice -----------------------------------------------------------------

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // --- Employee dashboard
      .addCase(fetchEmployeeDashboard.pending, (state, action) => {
        state.employee.status = 'loading';
        state.employee.error = null;
        state.employee.forUserId = action.meta.arg;
      })
      .addCase(fetchEmployeeDashboard.fulfilled, (state, action) => {
        state.employee.status = 'succeeded';
        state.employee.data = action.payload;
      })
      .addCase(fetchEmployeeDashboard.rejected, (state, action) => {
        state.employee.status = 'failed';
        state.employee.error =
          action.payload ?? 'Could not load your dashboard.';
      })

      // --- HR dashboard
      .addCase(fetchHrDashboard.pending, (state) => {
        state.hr.status = 'loading';
        state.hr.error = null;
      })
      .addCase(fetchHrDashboard.fulfilled, (state, action) => {
        state.hr.status = 'succeeded';
        state.hr.data = action.payload;
      })
      .addCase(fetchHrDashboard.rejected, (state, action) => {
        state.hr.status = 'failed';
        state.hr.error = action.payload ?? 'Could not load HR metrics.';
      })

      // --- HR dashboard recent
      .addCase(fetchHrDashboardRecent.pending, (state) => {
        state.hrRecent.status = 'loading';
        state.hrRecent.error = null;
      })
      .addCase(fetchHrDashboardRecent.fulfilled, (state, action) => {
        state.hrRecent.status = 'succeeded';
        state.hrRecent.data = action.payload;
      })
      .addCase(fetchHrDashboardRecent.rejected, (state, action) => {
        state.hrRecent.status = 'failed';
        state.hrRecent.error = action.payload ?? 'Could not load recent HR activities.';
      });
  },
});

// --- Selectors -------------------------------------------------------------

import type { RootState } from '../store';

export const selectEmployeeDashboard = (s: RootState) => s.dashboard.employee;
export const selectHrDashboard = (s: RootState) => s.dashboard.hr;
export const selectHrDashboardRecent = (s: RootState) => s.dashboard.hrRecent;

export default dashboardSlice.reducer;
