import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MoreHorizontal, UserPlus, Users, X } from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchDesignations,
  fetchEmployees,
  selectDesignations,
  selectEmployeeList,
} from '../../store/slices/employeesSlice';
import {
  fetchPendingCount,
  selectPendingCount,
} from '../../store/slices/leavesSlice';
import type { Department } from '../../types/auth';
import { range } from '../../utils/array';
import { getAvatarClassName } from '../../utils/avatarColor';
import { getInitials } from '../../utils/user';

const DEPARTMENTS: Array<Department | 'All'> = [
  'All',
  'Engineering',
  'Design',
  'Sales',
  'HR',
];

const PAGE_SIZE = 8;

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<Department | 'All'>('All');
  const [designation, setDesignation] = useState<string | 'All'>('All');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const dispatch = useAppDispatch();
  const list = useAppSelector(selectEmployeeList);
  const designations = useAppSelector(selectDesignations);
  const pendingCount = useAppSelector(selectPendingCount);
  const loading = list.status === 'loading';
  const error = list.status === 'failed' ? list.error : null;

  // One-time: warm the filter dropdown options and the header badge.
  useEffect(() => {
    void dispatch(fetchDesignations());
    void dispatch(fetchPendingCount());
  }, [dispatch]);

  // Re-fetch the directory whenever search/filter/page changes.
  useEffect(() => {
    void dispatch(
      fetchEmployees({
        search: debouncedSearch,
        department,
        designation,
        page,
        pageSize: PAGE_SIZE,
      }),
    );
  }, [dispatch, debouncedSearch, department, designation, page]);

  function refetch() {
    void dispatch(
      fetchEmployees({
        search: debouncedSearch,
        department,
        designation,
        page,
        pageSize: PAGE_SIZE,
      }),
    );
  }

  const activeFilters = useMemo(() => {
    const chips: Array<{ label: string; clear: () => void }> = [];
    if (department !== 'All') {
      chips.push({
        label: `Department: ${department}`,
        clear: () => {
          setDepartment('All');
          setPage(1);
        },
      });
    }
    if (designation !== 'All') {
      chips.push({
        label: `Designation: ${designation}`,
        clear: () => {
          setDesignation('All');
          setPage(1);
        },
      });
    }
    return chips;
  }, [department, designation]);

  function clearAll() {
    setDepartment('All');
    setDesignation('All');
    setSearch('');
    setPage(1);
  }

  return (
    <AppShell pendingCount={pendingCount ?? undefined}>
      <PageHeader
        title="Employees"
        description={
          list.status === 'succeeded'
            ? `${list.total} employees across the directory.`
            : 'Search and filter the company directory.'
        }
        action={
          <Link
            to="/employees/new"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Add employee
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name or email…"
          ariaLabel="Search employees"
          className="flex-1"
        />
        <div className="flex gap-2">
          <SelectFilter
            label="Department"
            value={department}
            options={DEPARTMENTS}
            onChange={(v) => {
              setDepartment(v as Department | 'All');
              setPage(1);
            }}
          />
          <SelectFilter
            label="Designation"
            value={designation}
            options={['All', ...designations]}
            onChange={(v) => {
              setDesignation(v);
              setPage(1);
            }}
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
            onClick={clearAll}
            className="text-slate-500 hover:text-slate-700 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner
            message="We couldn't load employees. Please try again."
            onRetry={refetch}
          />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <SkeletonRows />
        ) : list.items.length === 0 ? (
          <div className="p-2">
            <EmptyState
              Icon={Users}
              title="No employees match"
              description="Try clearing your filters or searching for a different name."
              action={
                activeFilters.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearAll}
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
                  <th className="text-left font-medium px-5 py-2.5">Name</th>
                  <th className="text-left font-medium px-5 py-2.5">
                    Department
                  </th>
                  <th className="text-left font-medium px-5 py-2.5">
                    Designation
                  </th>
                  <th className="text-left font-medium px-5 py-2.5">Email</th>
                  <th className="text-right font-medium px-5 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.items.map((emp) => {
                  const initials = getInitials(emp.firstName, emp.lastName);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
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
                            {emp.firstName} {emp.lastName}
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
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/employees/${emp.id}`}
                          aria-label={`Open ${emp.firstName} ${emp.lastName}`}
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
              page={list.page}
              total={list.total}
              pageSize={list.pageSize}
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
  onChange: (next: string) => void;
}

function SelectFilter({ label, value, options, onChange }: SelectFilterProps) {
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
            {opt === 'All' ? `All ${label.toLowerCase()}s` : opt}
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
