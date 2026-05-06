import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/context/AuthContext';

// Auth pages (eager — always needed immediately)
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterLandingPage } from '@/pages/auth/RegisterLandingPage';
import { RegisterUserPage } from '@/pages/auth/RegisterUserPage';
import { RegisterTechnicianPage } from '@/pages/auth/RegisterTechnicianPage';
// Lazy-loaded page chunks
const AdminDashboard = lazy(() =>
  import('@/pages/dashboard/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const TechnicianDashboard = lazy(() =>
  import('@/pages/dashboard/TechnicianDashboard').then((m) => ({ default: m.TechnicianDashboard }))
);
const UserDashboard = lazy(() =>
  import('@/pages/dashboard/UserDashboard').then((m) => ({ default: m.UserDashboard }))
);
const TicketListPage = lazy(() =>
  import('@/pages/tickets/TicketListPage').then((m) => ({ default: m.TicketListPage }))
);
const TicketDetailPage = lazy(() =>
  import('@/pages/tickets/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage }))
);
const NewTicketPage = lazy(() =>
  import('@/pages/tickets/NewTicketPage').then((m) => ({ default: m.NewTicketPage }))
);
const EstimatesPage = lazy(() =>
  import('@/pages/finance/EstimatesPage').then((m) => ({ default: m.EstimatesPage }))
);
const EstimateDetailPage = lazy(() =>
  import('@/pages/finance/EstimateDetailPage').then((m) => ({ default: m.EstimateDetailPage }))
);
const NewEstimatePage = lazy(() =>
  import('@/pages/finance/NewEstimatePage').then((m) => ({ default: m.NewEstimatePage }))
);
const InvoicesPage = lazy(() =>
  import('@/pages/finance/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);
const InvoiceDetailPage = lazy(() =>
  import('@/pages/finance/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage }))
);
const NewInvoicePage = lazy(() =>
  import('@/pages/finance/NewInvoicePage').then((m) => ({ default: m.NewInvoicePage }))
);
const PaymentsPage = lazy(() =>
  import('@/pages/finance/PaymentsPage').then((m) => ({ default: m.PaymentsPage }))
);
const NewPaymentPage = lazy(() =>
  import('@/pages/finance/NewPaymentPage').then((m) => ({ default: m.NewPaymentPage }))
);
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage }))
);
const SLAPoliciesPage = lazy(() =>
  import('@/pages/admin/SLAPoliciesPage').then((m) => ({ default: m.SLAPoliciesPage }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/dashboard/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuthContext();
  if (!user) return null;
  if (user.role === 'technician') return <Navigate to="/dashboard/technician" replace />;
  if (user.role === 'user') return <Navigate to="/dashboard/user" replace />;
  return <Navigate to="/dashboard/admin" replace />;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  if (isLoading) return null;
  if (isAuthenticated && user) {
    const dest =
      user.role === 'admin' ? '/dashboard/admin' :
      user.role === 'technician' ? '/dashboard/technician' :
      '/dashboard/user';
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public — redirect to dashboard if already logged in */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterLandingPage /></PublicOnlyRoute>} />
          <Route path="/register/user" element={<PublicOnlyRoute><RegisterUserPage /></PublicOnlyRoute>} />
          <Route path="/register/technician" element={<PublicOnlyRoute><RegisterTechnicianPage /></PublicOnlyRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* All authenticated routes live inside AppShell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>

              {/* Dashboard hub — redirects by role */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<AdminDashboard />} />
              </Route>
              <Route path="/dashboard/technician" element={
                <ProtectedRoute allowedRoles={['admin', 'technician']} />
              }>
                <Route index element={<TechnicianDashboard />} />
              </Route>
              <Route path="/dashboard/user" element={
                <ProtectedRoute allowedRoles={['user', 'admin']} />
              }>
                <Route index element={<UserDashboard />} />
              </Route>

              {/* Tickets */}
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/new" element={
                <ProtectedRoute allowedRoles={['admin', 'user']} />
              }>
                <Route index element={<NewTicketPage />} />
              </Route>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />

              {/* Finance */}
              <Route path="/finance/estimates" element={
                <ProtectedRoute allowedRoles={['admin', 'technician']} />
              }>
                <Route index element={<EstimatesPage />} />
              </Route>
              <Route path="/finance/estimates/new" element={
                <ProtectedRoute allowedRoles={['admin', 'technician']} />
              }>
                <Route index element={<NewEstimatePage />} />
              </Route>
              <Route path="/finance/estimates/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'technician']} />
              }>
                <Route index element={<EstimateDetailPage />} />
              </Route>

              <Route path="/finance/invoices" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<InvoicesPage />} />
              </Route>
              <Route path="/finance/invoices/new" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<NewInvoicePage />} />
              </Route>
              <Route path="/finance/invoices/:id" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<InvoiceDetailPage />} />
              </Route>

              <Route path="/finance/payments" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<PaymentsPage />} />
              </Route>
              <Route path="/finance/payments/new" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<NewPaymentPage />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<UsersPage />} />
              </Route>
              <Route path="/admin/sla" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<SLAPoliciesPage />} />
              </Route>

              {/* Analytics */}
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['admin']} />
              }>
                <Route index element={<AnalyticsPage />} />
              </Route>

              {/* Profile */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* 404 — must be outside ProtectedRoute so it never triggers auth redirect */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
