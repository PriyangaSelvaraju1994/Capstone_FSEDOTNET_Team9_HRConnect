/**
 * Employees slice (HR admin only views).
 *
 *   list          \u2192 paginated/filtered directory (S6)
 *   designations  \u2192 unique designation values for the filter dropdown
 *   byId          \u2192 cache for the detail page (S7)
 *   mutation      \u2192 transient state for create / update / delete (S8)
 *
 * Pages dispatch the thunks below and read state via the exported selectors.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { employeesApi } from '../../api/employeesApi';
import { ApiError } from '../../api/client';
import type {
  Employee,
  EmployeeFormValues,
  EmployeeListParams,
  EmployeeListResult,
} from '../../types/employee';
import { toMessage, type AsyncStatus } from '../asyncStatus';

// --- State -----------------------------------------------------------------

export interface EmployeesState {
  list: {
    items: Employee[];
    total: number;
    page: number;
    pageSize: number;
    status: AsyncStatus;
    error: string | null;
    appliedParams: EmployeeListParams | null;
  };
  designations: {
    items: string[];
    status: AsyncStatus;
  };
  byId: {
    entries: Record<number, Employee>;
    status: AsyncStatus;
    error: string | null;
    /** Discriminates between "haven't fetched" and "fetched but 404". */
    notFoundIds: number[];
    fetchingId: number | null;
  };
  mutation: {
    status: AsyncStatus;
    error: string | null;
    /** Optional field hint (e.g. "email") for inline form errors. */
    field: string | null;
  };
}

const initialState: EmployeesState = {
  list: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 8,
    status: 'idle',
    error: null,
    appliedParams: null,
  },
  designations: { items: [], status: 'idle' },
  byId: {
    entries: {},
    status: 'idle',
    error: null,
    notFoundIds: [],
    fetchingId: null,
  },
  mutation: { status: 'idle', error: null, field: null },
};

// --- Thunks ----------------------------------------------------------------

export const fetchEmployees = createAsyncThunk<
  EmployeeListResult,
  EmployeeListParams,
  { rejectValue: string }
>('employees/fetchList', async (params, { rejectWithValue }) => {
  try {
    return await employeesApi.list(params);
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not load employees.'));
  }
});

export const fetchDesignations = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>('employees/fetchDesignations', async (_, { rejectWithValue }) => {
  try {
    return await employeesApi.listDesignations();
  } catch (err) {
    return rejectWithValue(toMessage(err));
  }
});

export interface FetchEmployeeRejection {
  message: string;
  notFound: boolean;
  id: number;
}

export const fetchEmployeeById = createAsyncThunk<
  Employee,
  number,
  { rejectValue: FetchEmployeeRejection }
>('employees/fetchById', async (id, { rejectWithValue }) => {
  try {
    return await employeesApi.getById(id);
  } catch (err) {
    return rejectWithValue({
      id,
      notFound: err instanceof ApiError && err.status === 404,
      message: toMessage(err, 'Could not load employee.'),
    });
  }
});

export interface MutateEmployeeRejection {
  message: string;
  field: string | null;
}

function toMutateRejection(err: unknown, fallback: string): MutateEmployeeRejection {
  if (err instanceof ApiError && err.payload.field) {
    return { message: err.payload.message, field: err.payload.field };
  }
  return { message: toMessage(err, fallback), field: null };
}

export const createEmployee = createAsyncThunk<
  Employee,
  EmployeeFormValues,
  { rejectValue: MutateEmployeeRejection }
>('employees/create', async (values, { rejectWithValue }) => {
  try {
    return await employeesApi.create(values);
  } catch (err) {
    return rejectWithValue(toMutateRejection(err, 'Could not create employee.'));
  }
});

export const updateEmployee = createAsyncThunk<
  Employee,
  { id: number; values: EmployeeFormValues },
  { rejectValue: MutateEmployeeRejection }
>('employees/update', async ({ id, values }, { rejectWithValue }) => {
  try {
    return await employeesApi.update(id, values);
  } catch (err) {
    return rejectWithValue(toMutateRejection(err, 'Could not update employee.'));
  }
});

export const deleteEmployee = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('employees/delete', async (id, { rejectWithValue }) => {
  try {
    await employeesApi.remove(id);
    return id;
  } catch (err) {
    return rejectWithValue(toMessage(err, 'Could not delete employee.'));
  }
});

// --- Slice -----------------------------------------------------------------

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearEmployeeMutationError(state) {
      state.mutation.error = null;
      state.mutation.field = null;
      if (state.mutation.status === 'failed') state.mutation.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetchEmployees
      .addCase(fetchEmployees.pending, (state, action) => {
        state.list.status = 'loading';
        state.list.error = null;
        state.list.appliedParams = action.meta.arg;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.items = action.payload.items;
        state.list.total = action.payload.total;
        state.list.page = action.payload.page;
        state.list.pageSize = action.payload.pageSize;
        // Keep the byId cache warm so navigating to detail is instant.
        for (const e of action.payload.items) state.byId.entries[e.id] = e;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = action.payload ?? 'Could not load employees.';
      })

      // --- fetchDesignations
      .addCase(fetchDesignations.pending, (state) => {
        state.designations.status = 'loading';
      })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.designations.status = 'succeeded';
        state.designations.items = action.payload;
      })
      .addCase(fetchDesignations.rejected, (state) => {
        state.designations.status = 'failed';
      })

      // --- fetchEmployeeById
      .addCase(fetchEmployeeById.pending, (state, action) => {
        state.byId.status = 'loading';
        state.byId.error = null;
        state.byId.fetchingId = action.meta.arg;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.byId.status = 'succeeded';
        state.byId.entries[action.payload.id] = action.payload;
        state.byId.fetchingId = null;
        // Clear any prior 404 mark for this id.
        state.byId.notFoundIds = state.byId.notFoundIds.filter(
          (id) => id !== action.payload.id,
        );
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.byId.status = 'failed';
        state.byId.error = action.payload?.message ?? 'Could not load employee.';
        state.byId.fetchingId = null;
        if (action.payload?.notFound && action.payload.id) {
          if (!state.byId.notFoundIds.includes(action.payload.id)) {
            state.byId.notFoundIds.push(action.payload.id);
          }
        }
      })

      // --- deleteEmployee success: purge from list + cache
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        const id = action.payload;
        state.list.items = state.list.items.filter((e) => e.id !== id);
        state.list.total = Math.max(0, state.list.total - 1);
        delete state.byId.entries[id];
      })

      // --- create/update success: refresh the cache entry
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        state.byId.entries[action.payload.id] = action.payload;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.mutation.status = 'succeeded';
        state.byId.entries[action.payload.id] = action.payload;
        // Patch the row in the open list page if present.
        const idx = state.list.items.findIndex(
          (e) => e.id === action.payload.id,
        );
        if (idx !== -1) state.list.items[idx] = action.payload;
      })

      // --- Mutations: shared pending/rejected handling
      .addMatcher(
        (action): action is PayloadAction<unknown> =>
          [
            createEmployee.pending.type,
            updateEmployee.pending.type,
            deleteEmployee.pending.type,
          ].includes(action.type),
        (state) => {
          state.mutation.status = 'loading';
          state.mutation.error = null;
          state.mutation.field = null;
        },
      )
      .addMatcher(
        (action): action is PayloadAction<
          MutateEmployeeRejection | string | undefined
        > =>
          [
            createEmployee.rejected.type,
            updateEmployee.rejected.type,
            deleteEmployee.rejected.type,
          ].includes(action.type),
        (state, action) => {
          state.mutation.status = 'failed';
          const payload = action.payload;
          if (payload && typeof payload === 'object') {
            state.mutation.error = payload.message;
            state.mutation.field = payload.field;
          } else {
            state.mutation.error =
              typeof payload === 'string' ? payload : 'Could not save changes.';
            state.mutation.field = null;
          }
        },
      );
  },
});

export const { clearEmployeeMutationError } = employeesSlice.actions;

// --- Selectors -------------------------------------------------------------

import type { RootState } from '../store';

export const selectEmployeeList = (s: RootState) => s.employees.list;
export const selectDesignations = (s: RootState) => s.employees.designations.items;
export const selectEmployeeById = (id: number | undefined) => (s: RootState) =>
  id ? s.employees.byId.entries[id] ?? null : null;
export const selectEmployeeByIdStatus = (s: RootState) => s.employees.byId;
export const selectEmployeeIsNotFound = (id: number | undefined) => (s: RootState) =>
  Boolean(id) && s.employees.byId.notFoundIds.includes(id ?? 0);
export const selectEmployeeMutation = (s: RootState) => s.employees.mutation;

export default employeesSlice.reducer;
