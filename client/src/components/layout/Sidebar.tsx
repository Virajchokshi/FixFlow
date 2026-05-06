import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Users,
  ShieldCheck,
  FileText,
  Receipt,
  CreditCard,
  PlusCircle,
  BarChart3,
  ClipboardList,
  TrendingUp,
  X,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    label: 'My Dashboard',
    href: '/dashboard/technician',
    icon: BarChart3,
    roles: ['technician'],
  },
  {
    label: 'My Dashboard',
    href: '/dashboard/user',
    icon: LayoutDashboard,
    roles: ['user'],
  },
  {
    label: 'All Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['admin'],
  },
  {
    label: 'My Queue',
    href: '/tickets',
    icon: ClipboardList,
    roles: ['technician'],
  },
  {
    label: 'My Tickets',
    href: '/tickets',
    icon: Ticket,
    roles: ['user'],
  },
  {
    label: 'New Request',
    href: '/tickets/new',
    icon: PlusCircle,
    roles: ['user'],
  },
  {
    label: 'New Ticket',
    href: '/tickets/new',
    icon: PlusCircle,
    roles: ['admin'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'SLA Policies',
    href: '/admin/sla',
    icon: ShieldCheck,
    roles: ['admin'],
  },
  {
    label: 'Estimates',
    href: '/finance/estimates',
    icon: FileText,
    roles: ['admin', 'technician'],
  },
  {
    label: 'Invoices',
    href: '/finance/invoices',
    icon: Receipt,
    roles: ['admin'],
  },
  {
    label: 'Payments',
    href: '/finance/payments',
    icon: CreditCard,
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: TrendingUp,
    roles: ['admin'],
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    roles: ['admin', 'technician', 'user'],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar transition-transform duration-300 ease-in-out',
        // Mobile: slide in/out; Desktop: always visible
        open ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-3">
        <Link
          to={
            user.role === 'admin'
              ? '/dashboard'
              : user.role === 'technician'
              ? '/dashboard/technician'
              : '/dashboard/user'
          }
          onClick={onClose}
          className="h-full flex items-center"
        >
          <img
            src="/logo.png"
            alt="FixFlow"
            className="h-full w-auto object-contain"
          />
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden text-sidebar-foreground hover:text-white p-1 rounded"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== '/dashboard' &&
                item.href !== '/dashboard/technician' &&
                item.href !== '/dashboard/user' &&
                location.pathname.startsWith(item.href));

            return (
              <li key={`${item.label}-${item.href}`}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-l-2 border-fixflow-primary bg-sidebar-active text-white pl-[10px]'
                      : 'text-sidebar-foreground hover:bg-sidebar-active hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fixflow-primary text-xs font-semibold text-white uppercase hover:opacity-80 transition-opacity"
          >
            {user.name.charAt(0)}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
