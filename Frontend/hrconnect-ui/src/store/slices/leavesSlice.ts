/**
 * Leaves slice — owns every server-derived slice of leave data the SPA needs:
 *
 *   myLeaves         \u2192 the signed-in employee's paginated history (S4)
 *   employeeHistory  \u2192 any other employee's history (HR detail page S7)
 *   balances         \u2192 the four balance cards (S1 / S5 sidebar / S7)
 *   pendingQueue     \u2192 admin approval inbox (S9)
 *   pendingCount     \u2192 the red "queue" badge in the header (shared)
 *   mutation         \u2192 transient state for create/cancel/approve/reject
 *
 * Pages dispatch the thunks below and read state via the exported selectors.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { leavesApi } from '../../api/leavesApi';
import type {
  CreateLeaveRequest,
  LeaveBalance,
  LeaveListParams,
  LeaveListResult,
  LeaveRequest,
} from '../../types/leave';
import { toMessage, type AsyncStatus } from '../asyncStatus';

// --- State -----------------------------------------------------------------

interface ListSlot {
  items: LeaveRequest[];
  total: number;
  page: number;
  pageSize: number;
  status: AsyncStatus;
  error: string | null;
}

const emptyList = (): ListSlot => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
  status: 'idle',
  error: null,
});

export interface LeavesState {
  myLeaves: ListSlot & { appliedParams: LeaveListParams | null };
  employeeHistory: ListSlot & { forEmployeeId: number | null };
  balances: {
    byEmployeeId: Record<number, LeaveBalance[]>;
    status: AsyncStatus;
    error: string | null;
    fetchingFor: number | null;
  };
  pendingQueue: {
    items: LeaveRequest[];
    status: AsyncStatus;
    error: string | null;
  };
  pendingCount: {
    value: number | null;
    status: AsyncStatus;
  };
  mutation: {
    status: AsyncStatus;
    error: string | null;
  };
}

const initialState: LeavesState = {
  myLeaves: { ...emptyList(), appliedParams: null },
  employeeHistory: { ...emptyList(), forEmployeeId: null },
  balances: {
    byEmployeeId: {},
    status: 'idle',
    error: null,
    fetchingFor: null,
  },
  pendingQueue: { items: [], status: 'idle', error: null },
  pendingCount: { value: null, status: 'idle' },
  mutation: { status: 'idle', error: null },
};

// --- Thunks ----------------------------------------------------------------

export const fetchMyLeaves = createAsyncThunk<
  LeaveRequest[],
  LeaveListParams,
  { rejectValue: string }
>('leaves/mine', async (params, { rejectWithValue }) => {
  try {
    return await leavesApi.list(params);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load your leaves.'));
  }
});

export const fetchEmployeeHistory = createAsyncThunk<
  LeaveListResult & { employeeId: number },
  LeaveListParams,
  { rejectValue: string }
>(
  'leaves/fetchEmployeeHistory',
  async (params, { rejectWithValue }) => {
    try {
      const employeeId = params.employeeId ?? 0;
      const res = await leavesApi.list(params);
      return { ...res, employeeId };
    } catch (err) {
      return rejectWithValue(toMessage(err, 'Could not load leave history.'));
    }
  },
);

export const fetchBalances = createAsyncThunk<
  { employeeId: number; balances: LeaveBalance[] },
  number,
  { rejectValue: string }
>('leaves/fetchBalances', async (employeeId, { rejectWithValue }) => {
  try {
    const balances = await leavesApi.getBalances(employeeId);
    return { employeeId, balances };
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load balances.'));
  }
});

export const fetchPendingQueue = createAsyncThunk<
  LeaveRequest[],
  void,
  { rejectValue: string }
>('leaves/fetchPendingQueue', async (_, { rejectWithValue }) => {
  try {
    return await leavesApi.listPending();
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load the queue.'));
  }
});

export const fetchPendingCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>('leaves/fetchPendingCount', async (_, { rejectWithValue }) => {
  try {
    return await leavesApi.getPendingCount();
  } catch (err) {
    return rejectWithValue(toMessage(err));
  }
});

export const createLeave = createAsyncThunk<
  LeaveRequest,
  CreateLeaveRequest,
  { rejectValue: string }
>('leaves/create', async (payload, { rejectWithValue }) => {
  try {
    return await leavesApi.create(payload);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not submit your request.'));
  }
});

export const cancelLeave = createAsyncThunk<
  LeaveRequest,
  string,
  { rejectValue: string }
>('leaves/cancel', async (id, { rejectWithValue }) => {
  try {
    return await leavesApi.cancel(id);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not cancel the request.'));
  }
});

export const approveLeave = createAsyncThunk<
  LeaveRequest,
  string,
  { rejectValue: string }
>('leaves/approve', async (id, { rejectWithValue }) => {
  try {
    return await leavesApi.approve(id);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not approve the request.'));
  }
});

export const rejectLeave = createAsyncThunk<
  LeaveRequest,
  string,
  { rejectValue: string }
>('leaves/reject', async (id, { rejectWithValue }) => {
  try {
    return await leavesApi.reject(id);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not reject the request.'));
  }
});

// --- Slice -----------------------------------------------------------------

const leavesSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    /** Reset the mutation error banner once the user has acknowledged it. */
    clearLeaveMutationError(state) {
      state.mutation.error = null;
      if (state.mutation.status === 'failed') state.mutation.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchMyLeaves
      .addCase(fetchMyLeaves.pending, (state, action) => {
        state.myLeaves.status = 'loading';
        state.myLeaves.error = null;
        state.myLeaves.appliedParams = action.meta.arg;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        debugger
        state.myLeaves.status = 'succeeded';
        state.myLeaves.items = action.payload;
        state.myLeaves.total = action.payload.length;
      })
      .addCase(fetchMyLeaves.rejected, (state) => {
        state.myLeaves.status = 'failed';
        state.myLeaves.error = 'Could not load your leaves.';
      })

      // --- fetchEmployeeHistory
      .addCase(fetchEmployeeHistory.pending, (state, action) => {
        state.employeeHistory.status = 'loading';
        state.employeeHistory.error = null;
        state.employeeHistory.forEmployeeId = action.meta.arg.employeeId ?? null;
      })
      .addCase(fetchEmployeeHistory.fulfilled, (state, action) => {
        state.employeeHistory.status = 'succeeded';
        state.employeeHistory.items = action.payload.items;
        state.employeeHistory.total = action.payload.total;
        state.employeeHistory.page = action.payload.page;
        state.employeeHistory.pageSize = action.payload.pageSize;
      })
      .addCase(fetchEmployeeHistory.rejected, (state) => {
        state.employeeHistory.status = 'failed';
        state.employeeHistory.error = 'Could not load leave history.';
      })

      // --- fetchBalances
      .addCase(fetchBalances.pending, (state, action) => {
        state.balances.status = 'loading';
        state.balances.error = null;
        state.balances.fetchingFor = action.meta.arg;
      })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances.status = 'succeeded';
        state.balances.byEmployeeId[action.payload.employeeId] =
          action.payload.balances;
        state.balances.fetchingFor = null;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.balances.status = 'failed';
        state.balances.error = action.payload ?? 'Could not load balances.';
        state.balances.fetchingFor = null;
      })

      // --- fetchPendingQueue
      .addCase(fetchPendingQueue.pending, (state) => {
        state.pendingQueue.status = 'loading';
        state.pendingQueue.error = null;
      })
      .addCase(fetchPendingQueue.fulfilled, (state, action) => {
        state.pendingQueue.status = 'succeeded';
        state.pendingQueue.items = action.payload;
        state.pendingCount.value = action.payload.length;
        state.pendingCount.status = 'succeeded';
      })
      .addCase(fetchPendingQueue.rejected, (state, action) => {
        state.pendingQueue.status = 'failed';
        state.pendingQueue.error = action.payload ?? 'Could not load the queue.';
      })

      // --- fetchPendingCount
      .addCase(fetchPendingCount.pending, (state) => {
        state.pendingCount.status = 'loading';
      })
      .addCase(fetchPendingCount.fulfilled, (state, action) => {
        state.pendingCount.status = 'succeeded';
        state.pendingCount.value = action.payload;
      })
      .addCase(fetchPendingCount.rejected, (state) => {
        state.pendingCount.status = 'failed';
      })

      // --- createLeave success: new leaves are already visible when the user
      //     returns to My Leaves (after redirect with success message).
      .addCase(createLeave.fulfilled, (state) => {
        state.mutation.status = 'succeeded';
      })

      // --- cancelLeave success: patch the matching row in any list slot.
      .addCase(cancelLeave.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        patchInList(state.myLeaves.items, action.payload);
        patchInList(state.employeeHistory.items, action.payload);
      })

      // --- approveLeave / rejectLeave: remove from pending queue + decrement
      //     the header badge so the UI stays consistent without a refetch.
      .addCase(approveLeave.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        removePending(state, action.payload.id);
        patchInList(state.employeeHistory.items, action.payload);
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        removePending(state, action.payload.id);
        patchInList(state.employeeHistory.items, action.payload);
      })

      // --- Mutations: shared pending/rejected handling.
      //     Must be the *last* builder calls because matchers cannot be
      //     followed by addCase per RTK's builder rules.
      .addMatcher(
        (action): action is PayloadAction<unknown> =>
          [
            createLeave.pending.type,
            cancelLeave.pending.type,
            approveLeave.pending.type,
            rejectLeave.pending.type,
          ].includes(action.type),
        (state) => {
          state.mutation.status = 'loading';
          state.mutation.error = null;
        },
      )
      .addMatcher(
        (action): action is PayloadAction<string | undefined> =>
          [
            createLeave.rejected.type,
            cancelLeave.rejected.type,
            approveLeave.rejected.type,
            rejectLeave.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.mutation.status = 'failed';
          state.mutation.error = action.payload ?? 'Could not complete the action.';
        },
      );
  },
});

// --- Local reducer helpers -------------------------------------------------

function patchInList(items: LeaveRequest[], updated: LeaveRequest) {
  const idx = items.findIndex((r) => r.id === updated.id);
  if (idx !== -1) items[idx] = updated;
}

function removePending(state: LeavesState, id: string) {
  state.pendingQueue.items = state.pendingQueue.items.filter((r) => r.id !== id);
  if (typeof state.pendingCount.value === 'number') {
    state.pendingCount.value = Math.max(0, state.pendingCount.value - 1);
  }
}

export const { clearLeaveMutationError } = leavesSlice.actions;

// --- Selectors -------------------------------------------------------------

import type { RootState } from '../store';

export const selectMyLeaves = (s: RootState) => s.leaves.myLeaves;
export const selectEmployeeHistory = (s: RootState) => s.leaves.employeeHistory;
export const selectBalancesFor = (employeeId: number) => (s: RootState) =>
  s.leaves.balances.byEmployeeId[employeeId] ?? null;
export const selectBalancesStatus = (s: RootState) => s.leaves.balances.status;
export const selectPendingQueue = (s: RootState) => s.leaves.pendingQueue;
export const selectPendingCount = (s: RootState) => s.leaves.pendingCount.value;
export const selectLeaveMutation = (s: RootState) => s.leaves.mutation;

export default leavesSlice.reducer;
