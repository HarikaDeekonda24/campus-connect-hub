import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import StudentDashboard from './StudentDashboard';
import FacultyDashboard from './FacultyDashboard';
import HODDashboard from './HODDashboard';
import AdminDashboard from './AdminDashboard';
import { Navigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;

  const getDashboard = () => {
    switch (user?.role) {
      case 'admin': return <AdminDashboard />;
      case 'hod': return <HODDashboard />;
      case 'faculty': return <FacultyDashboard />;
      default: return <StudentDashboard />;
    }
  };

  return <DashboardLayout>{getDashboard()}</DashboardLayout>;
}
