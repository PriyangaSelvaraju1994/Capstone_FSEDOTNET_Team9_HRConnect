/**
 * Employees data layer (HR admin only).
 *
 * Talks to the HRConnect backend via the shared axios instance.
 */
import { http } from './client';
import type {
  Employee,
  EmployeeFormValues,
  EmployeeListParams,
  EmployeeResult,
} from '../types/employee';

export const employeesApi = {
  list: (params: EmployeeListParams = {}): Promise<EmployeeResult[]> => {
    const requestParams: Record<string, string | number | boolean> = {};

    if (params.search?.trim()) {
      requestParams.search = params.search.trim();
    }
    if (params.department && params.department !== 'All') {
      requestParams.department = params.department;
    }
    if (params.designation && params.designation !== 'All') {
      requestParams.designation = params.designation;
    }
    if (params.status && params.status !== 'All') {
      requestParams.isActive = params.status === 'Active';
    }

    return http
      .get<EmployeeResult[]>('/employees', { params: requestParams })
      .then((r) => r.data);
  },

  getById: (id: number): Promise<EmployeeResult> =>
    http.get<EmployeeResult>(`/employees/${id}`).then((r) => r.data),

  listDesignations: (): Promise<string[]> =>
    http.get<string[]>('/employees/designations').then((r) => r.data),

  create: (values: EmployeeFormValues): Promise<Employee> =>
    http.post<Employee>('/employees', values).then((r) => r.data),

  update: (id: number, values: EmployeeFormValues): Promise<Employee> =>
    http.put<Employee>(`/employees/${id}`, values).then((r) => r.data),

  remove: (id: number): Promise<void> =>
    http.delete<void>(`/employees/${id}`).then(() => undefined),
};
