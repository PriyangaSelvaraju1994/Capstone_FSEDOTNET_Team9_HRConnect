import type { Department } from './auth';

export type EmployeeRole = 'Employee' | 'HR Admin';

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: Department;
  designation: string;
  role: EmployeeRole;
  joiningDate: string; // ISO date
  managerId?: string;
  managerName?: string;
}

/** Parameters accepted by `employeesApi.list()`. All are optional. */
export interface EmployeeListParams {
  search?: string;
  department?: Department | 'All';
  designation?: string | 'All';
  page?: number;
  pageSize?: number;
}

export interface EmployeeListResult {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

/** Form payload for the S8 Add/Edit form (omits derived/server fields). */
export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  designation: string;
  joiningDate: string;
  role: EmployeeRole;
}
