import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import employeesReducer from './slices/employeesSlice';
import leavesReducer from './slices/leavesSlice';
import profileReducer from './slices/profileSlice';
import { sessionStoragePersistence } from './middleware/sessionStoragePersistence';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaves: leavesReducer,
    employees: employeesReducer,
    profile: profileReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefault) => getDefault().concat(sessionStoragePersistence),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
