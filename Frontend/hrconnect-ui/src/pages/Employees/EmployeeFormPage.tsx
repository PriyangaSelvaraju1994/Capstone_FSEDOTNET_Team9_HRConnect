import { forwardRef, useEffect, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Mail,
} from 'lucide-react';
import { AppShell } from '../../components/AppShell';
import { Breadcrumb } from '../../components/Breadcrumb';
import { PageHeader } from '../../components/PageHeader';
import { SectionHeading } from '../../components/SectionHeading';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  createEmployee,
  fetchEmployeeById,
  selectEmployeeById,
  selectEmployeeIsNotFound,
  updateEmployee,
} from '../../store/slices/employeesSlice';
import {
  fetchPendingCount,
  selectPendingCount,
} from '../../store/slices/leavesSlice';
import type { Department } from '../../types/auth';
import type { EmployeeRole } from '../../types/employee';

const DEPARTMENTS: Department[] = ['IT', 'QE', 'Sales', 'HR'];
const ROLES: EmployeeRole[] = ['Employee', 'HR Admin'];

const schema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid work email'),
  department: z.enum(['IT', 'QE', 'Sales', 'HR']),
  designation: z.string().trim().min(1, 'Designation is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  role: z.enum(['Employee', 'HR Admin']),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  /** When true, the form is in edit mode and loads the employee by route id. */
  mode: 'create' | 'edit';
}

export default function EmployeeFormPage({ mode }: Props) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const editId = mode === 'edit' ? Number(params.id) : undefined;
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const existing = useAppSelector(selectEmployeeById(editId));
  const isNotFound = useAppSelector(selectEmployeeIsNotFound(editId));
  const pendingCount = useAppSelector(selectPendingCount);

  // Load the employee record in edit mode + the header badge always.
  useEffect(() => {
    if (editId) void dispatch(fetchEmployeeById(editId));
    void dispatch(fetchPendingCount());
  }, [dispatch, editId]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: 'IT',
      designation: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      role: 'Employee',
    },
  });

  // Populate form when the edit-mode employee resolves.
  useEffect(() => {
    if (existing) {
      reset({
        firstName: existing.firstName,
        lastName: existing.lastName,
        email: existing.email,
        department: existing.department,
        designation: existing.designation,
        joiningDate: existing.joiningDate.slice(0, 10),
        role: existing.role,
      });
    }
  }, [existing, reset]);

  if (mode === 'edit' && !editId) {
    return <Navigate to="/employees" replace />;
  }
  if (mode === 'edit' && isNotFound) {
    return <Navigate to="/404" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      if (editId) {
        await dispatch(updateEmployee({ id: editId, values })).unwrap();
      } else {
        await dispatch(createEmployee(values)).unwrap();
      }
      navigate('/employees');
    } catch (e) {
      // The employees slice rejects with { message, field } for known errors.
      const rejection = e as { field?: string | null; message?: string } | string;
      if (typeof rejection === 'object' && rejection?.field === 'email') {
        setError('email', {
          message: rejection.message ?? 'This email is already in use.',
        });
        return;
      }
      setSubmitError(
        typeof rejection === 'string'
          ? rejection
          : rejection?.message ?? 'Could not save the employee.',
      );
    }
  });

  const isEdit = mode === 'edit';

  return (
    <AppShell maxWidth="max-w-5xl" pendingCount={pendingCount ?? undefined}>
      <Breadcrumb
        items={[
          { label: 'Employees', to: '/employees' },
          { label: isEdit ? 'Edit employee' : 'New employee' },
        ]}
      />

      <PageHeader
        title={isEdit ? 'Edit employee' : 'Add a new employee'}
        description={
          <>
            Required fields are marked with{' '}
            <span className="text-rose-600">*</span>.
          </>
        }
      />

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        {submitError && (
          <div
            role="alert"
            className="mb-4 flex gap-2 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-900 text-sm"
          >
            <AlertCircle
              className="w-4 h-4 mt-0.5 flex-none"
              aria-hidden="true"
            />
            <span>{submitError}</span>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <section>
            <SectionHeading>Personal</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField
                id="firstName"
                label={<>First name <span className="text-rose-600">*</span></>}
                placeholder="Anita"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <TextField
                id="lastName"
                label={<>Last name <span className="text-rose-600">*</span></>}
                placeholder="Nair"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <div className="mt-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1"
              >
                Work email <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  placeholder="anita@company.com"
                  className={`w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors.email ? 'border-rose-400' : 'border-slate-300'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs text-rose-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </section>

          <section className="pt-3 border-t border-slate-100">
            <SectionHeading>Employment</SectionHeading>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium mb-1"
                >
                  Department <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="department"
                    aria-invalid={Boolean(errors.department)}
                    className={`w-full appearance-none px-3 py-2 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                      errors.department
                        ? 'border-rose-400'
                        : 'border-slate-300'
                    }`}
                    {...register('department')}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <TextField
                id="designation"
                label={
                  <>Designation <span className="text-rose-600">*</span></>
                }
                placeholder="Engineer"
                error={errors.designation?.message}
                {...register('designation')}
              />
              <TextField
                id="joiningDate"
                type="date"
                label={
                  <>Joining date <span className="text-rose-600">*</span></>
                }
                error={errors.joiningDate?.message}
                {...register('joiningDate')}
              />
              <fieldset>
                <legend className="block text-sm font-medium mb-1">
                  Role
                </legend>
                <div className="flex gap-2 pt-1">
                  {ROLES.map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        value={r}
                        {...register('role')}
                      />
                      <span className="text-sm">{r}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/employees"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4" aria-hidden="true" />
              )}{' '}
              {isEdit ? 'Save changes' : 'Save employee'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  error?: string;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ id, label, error, className, ...rest }, ref) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            error ? 'border-rose-400' : 'border-slate-300'
          } ${className ?? ''}`}
          {...rest}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-rose-600 mt-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);
