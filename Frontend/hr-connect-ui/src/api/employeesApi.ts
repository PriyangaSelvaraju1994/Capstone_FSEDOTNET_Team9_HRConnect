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
  EmployeeListResult,
} from '../types/employee';

export const employeesApi = {
  list: (params: EmployeeListParams = {}): Promise<EmployeeListResult> =>
    http
      .get<EmployeeListResult>('/employees', { params })
      .then((r) => r.data),

  getById: (id: string): Promise<Employee> =>
    http.get<Employee>(`/employees/${id}`).then((r) => r.data),

  listDesignations: (): Promise<string[]> =>
    http.get<string[]>('/employees/designations').then((r) => r.data),

  create: (values: EmployeeFormValues): Promise<Employee> =>
    http.post<Employee>('/employees', values).then((r) => r.data),

  update: (id: string, values: EmployeeFormValues): Promise<Employee> =>
    http.put<Employee>(`/employees/${id}`, values).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    http.delete<void>(`/employees/${id}`).then(() => undefined),
};
