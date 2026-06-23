import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, MoreHorizontal, Users, X } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { useToast } from '../../components/ToastProvider';
import { useEmployeesList } from '../../hooks/useEmployeesList';
import type { Department, Designation } from '../../types/auth';
import type { EmployeeStatusFilter } from '../../types/employee';
import { range } from '../../utils/array';
import { getAvatarClassName } from '../../utils/avatarColor';
import { getInitials } from '../../utils/user';

const DEPARTMENTS: Array<Department | 'All'> = [
  'All',
  'IT',
  'QE',
  'Sales',
  'HR',
];

const DESIGNATIONS: Array<Designation | 'All'> = [
  'All',
  'Software Engineer',
  'QA',
  'Finance',
  'Engineer',
  'Architect'
];

const STATUSES: EmployeeStatusFilter[] = ['All', 'Active', 'Inactive'];

export default function EmployeesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (!state?.message) return;

    toast.success(state.message);
    navigate(location.pathname + location.search, { replace: true });
  }, [location.pathname, location.search, location.state, navigate, toast]);

  const {
    employees,
    totalCount,
    loading,
    error,
    search,
    setSearch,
    department,
    designation,
    status,
    setDepartment,
    setDesignation,
    setStatus,
    activeFilters,
    clearAllFilters,
    page,
    pageSize,
    setPage,
  } = useEmployeesList();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  return (
    <AppShell>
      <PageHeader
        title="Employees"
        description={
          !loading && totalCount > 0
            ? `${totalCount} employees across the directory.`
            : 'Search and filter the company directory.'
        }
        action={
          <></>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name or email…"
          ariaLabel="Search employees"
          className="flex-1"
        />
        <div className="flex gap-2">
          <SelectFilter
            label="Department"
            value={department}
            options={DEPARTMENTS}
            onChange={(v) => setDepartment(v as Department | 'All')}
          />
          <SelectFilter
            label="Designation"
            value={designation}
            options={DESIGNATIONS}
            onChange={(v) => setDesignation(v as Designation | 'All')}
          />
          <SelectFilter
            label="Status"
            value={status}
            options={STATUSES}
            allLabel="All statuses"
            onChange={(v) => setStatus(v as EmployeeStatusFilter)}
          />
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
          {activeFilters.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-100 text-brand-800"
            >
              {f.label}
              <button
                type="button"
                onClick={f.clear}
                aria-label={`Clear ${f.label}`}
                className="hover:text-brand-900"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : employees.length === 0 ? (
          <div className="p-2">
            <EmptyState
              Icon={Users}
              title="No employees match"
              description="Try clearing your filters or searching for a different name."
              action={
                activeFilters.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-brand-600 hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Employee ID</th>
                  <th className="text-left font-medium px-5 py-2.5">Name</th>
                  <th className="text-left font-medium px-5 py-2.5">
                    Department
                  </th>
                  <th className="text-left font-medium px-5 py-2.5">
                    Designation
                  </th>
                  <th className="text-left font-medium px-5 py-2.5">Email</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                  <th className="text-right font-medium px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const initials = getInitials(emp.fullName ?? '', '') || '··';
                  const isActive = Boolean(emp.isActive);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-700">{`EM${emp.id}`}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={initials}
                            className={getAvatarClassName(initials)}
                          />
                          <Link
                            to={`/employees/${emp.id}`}
                            className="font-medium hover:text-brand-700"
                          >
                            {emp.fullName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {emp.department}
                      </td>
                      <td className="px-5 py-3 text-slate-700">
                        {emp.designation}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{emp.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/employees/${emp.id}`}
                          aria-label={`Open ${emp.fullName}`}
                          className="inline-flex p-1.5 rounded hover:bg-slate-100"
                        >
                          <MoreHorizontal
                            className="w-4 h-4 text-slate-500"
                            aria-hidden="true"
                          />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={page}
              total={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="employees"
            />
          </>
        )}
      </div>
    </AppShell>
  );
}

interface SelectFilterProps {
  label: string;
  value: string;
  options: string[];
  allLabel?: string;
  onChange: (next: string) => void;
}

function SelectFilter({ label, value, options, allLabel, onChange }: SelectFilterProps) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === 'All' ? (allLabel ?? `All ${label.toLowerCase()}s`) : opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="w-4 h-4 absolute right-2.5 top-2.5 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {range(6).map((i) => (
        <div key={i} className="px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-100 rounded ml-auto" />
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-4 w-40 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}
