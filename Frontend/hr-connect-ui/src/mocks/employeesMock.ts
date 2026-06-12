import employeesData from './employees.json';
import type {
  Employee,
  EmployeeFormValues,
  EmployeeListParams,
  EmployeeListResult,
} from '../types/employee';

interface Seed {
  items: Employee[];
}

const seed = employeesData as Seed;

/** In-memory store — mutated by create/update/delete so the UI feels live. */
let store: Employee[] = structuredClone(seed.items);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class EmployeeNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Employee ${id} not found`);
    this.name = 'EmployeeNotFoundError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(public readonly email: string) {
    super(`Email ${email} is already in use`);
    this.name = 'DuplicateEmailError';
  }
}

function matches(emp: Employee, params: EmployeeListParams): boolean {
  if (params.search) {
    const q = params.search.toLowerCase().trim();
    if (q.length > 0) {
      const hay =
        `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
  }
  if (params.department && params.department !== 'All') {
    if (emp.department !== params.department) return false;
  }
  if (params.designation && params.designation !== 'All') {
    if (emp.designation !== params.designation) return false;
  }
  return true;
}

export const mockEmployees = {
  async list(params: EmployeeListParams = {}): Promise<EmployeeListResult> {
    await sleep(350);
    const filtered = store.filter((e) => matches(e, params));
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, params.pageSize ?? 10);
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return {
      items: structuredClone(items),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async getById(id: string): Promise<Employee> {
    await sleep(300);
    const found = store.find((e) => e.id === id);
    if (!found) throw new EmployeeNotFoundError(id);
    return structuredClone(found);
  },

  async listDesignations(): Promise<string[]> {
    await sleep(120);
    return Array.from(new Set(store.map((e) => e.designation))).sort();
  },

  async create(values: EmployeeFormValues): Promise<Employee> {
    await sleep(500);
    if (store.some((e) => e.email.toLowerCase() === values.email.toLowerCase())) {
      throw new DuplicateEmailError(values.email);
    }
    const id = `u-${String(store.length + 100).padStart(3, '0')}`;
    const code = `EMP-${String(200 + store.length).padStart(4, '0')}`;
    const emp: Employee = { id, employeeCode: code, ...values };
    store = [...store, emp];
    return structuredClone(emp);
  },

  async update(id: string, values: EmployeeFormValues): Promise<Employee> {
    await sleep(500);
    const idx = store.findIndex((e) => e.id === id);
    if (idx < 0) throw new EmployeeNotFoundError(id);
    if (
      store.some(
        (e) =>
          e.id !== id && e.email.toLowerCase() === values.email.toLowerCase(),
      )
    ) {
      throw new DuplicateEmailError(values.email);
    }
    const merged: Employee = { ...store[idx], ...values };
    store = store.map((e, i) => (i === idx ? merged : e));
    return structuredClone(merged);
  },

  async remove(id: string): Promise<void> {
    await sleep(400);
    if (!store.some((e) => e.id === id)) throw new EmployeeNotFoundError(id);
    store = store.filter((e) => e.id !== id);
  },
};
