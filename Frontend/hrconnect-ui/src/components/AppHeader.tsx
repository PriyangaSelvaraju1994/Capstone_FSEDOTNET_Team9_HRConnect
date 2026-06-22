import { Building2, ChevronDown, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/user';
import { Avatar } from './Avatar';

interface NavItem {
  to: string;
  label: string;
  /** Optional numeric badge (e.g. queue count). */
  badge?: number;
}

const EMPLOYEE_NAV: NavItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/my-leaves', label: 'My Leaves' },
  { to: '/profile', label: 'Profile' },
];

function buildAdminNav(): NavItem[] {
  return [
    { to: '/', label: 'Dashboard' },
    { to: '/employees', label: 'Employees' },
    { to: '/admin/queue', label: 'Queue' },
    { to: '/my-leaves', label: 'My Leaves' },
    { to: '/profile', label: 'Profile' },
  ];
}

export function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = isAdmin ? buildAdminNav() : EMPLOYEE_NAV;
  const initials = user ? getInitials(user.firstName ?? '', '') : '··';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-slate-900 font-semibold">
            <Building2 className="w-5 h-5 text-brand-600" aria-hidden="true" />
            <span>HRConnect</span>
          </Link>
          <nav aria-label="Primary" className="hidden md:flex items-center gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ${isActive
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 hover:bg-slate-100 rounded-md pl-1 pr-2 py-1"
            >
              <Avatar initials={initials} size={7} />
              <ChevronDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-md py-1 text-sm"
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
