import { useAuth } from '../../hooks/useAuth';
import EmployeeDashboardPage from './EmployeeDashboardPage';
import HrDashboardPage from './HrDashboardPage';

/**
 * Route entry for `/`. Switches between the HR admin dashboard (S3a) and
 * the employee dashboard (S3) based on the signed-in user's role.
 */
export default function DashboardPage() {
  const { isAdmin } = useAuth();
  return isAdmin ? <HrDashboardPage /> : <EmployeeDashboardPage />;
}
