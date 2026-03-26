import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}
