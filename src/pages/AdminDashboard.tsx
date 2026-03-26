import { Users, Calendar, BarChart3, Shield, AlertCircle, Activity, GitBranch } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockEvents, mockConcerns, mockUsers, ALL_BRANCHES } from '@/lib/mock-data';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground">
        <p className="text-primary-foreground/60 text-sm">Admin Panel</p>
        <h1 className="text-2xl md:text-3xl font-display mt-1">Welcome, {user?.name}</h1>
        <p className="text-primary-foreground/70 mt-2 text-sm">Full system access · All branches</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: mockUsers.length, icon: Users, color: 'text-info' },
          { label: 'Total Events', value: mockEvents.length, icon: Calendar, color: 'text-success' },
          { label: 'Pending Review', value: mockEvents.filter(e => e.status === 'pending').length, icon: AlertCircle, color: 'text-warning' },
          { label: 'Open Concerns', value: mockConcerns.filter(c => c.status === 'new').length, icon: Shield, color: 'text-destructive' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
            <div className="flex items-center justify-between">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-2xl font-display text-foreground">{s.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User management */}
        <div className="campus-card p-5">
          <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> User Management</h2>
          <div className="space-y-3">
            {mockUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full campus-gradient flex items-center justify-center text-primary-foreground text-xs font-medium">{u.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.branches.join(', ')}</p>
                  </div>
                </div>
                <span className={`campus-badge capitalize ${u.role === 'admin' ? 'campus-badge-destructive' : u.role === 'hod' ? 'campus-badge-gold' : u.role === 'faculty' ? 'campus-badge-navy' : 'campus-badge-success'}`}>
                  {u.role === 'hod' ? 'HOD' : u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Branch overview & Activity */}
        <div className="space-y-6">
          <div className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5" /> Branches</h2>
            <div className="flex flex-wrap gap-2">
              {ALL_BRANCHES.map(b => (
                <span key={b} className="campus-badge-navy">{b}</span>
              ))}
            </div>
          </div>

          <div className="campus-card p-5">
            <h2 className="text-lg font-display text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h2>
            <div className="space-y-4">
              {[
                { text: 'New event "Web Dev Bootcamp" submitted (CSE)', time: '2h ago', icon: Calendar },
                { text: 'Student concern about Wi-Fi submitted', time: '5h ago', icon: AlertCircle },
                { text: 'HOD approved HackCampus 2026', time: '1d ago', icon: Shield },
                { text: 'New student registered: Arun Kumar (CSE)', time: '2d ago', icon: Users },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <activity.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
