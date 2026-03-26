import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <DashboardLayout>
      {user?.role === 'admin' ? <AdminDashboard /> : user?.role === 'faculty' ? <FacultyDashboard /> : <StudentDashboard />}
    </DashboardLayout>
  );
}
