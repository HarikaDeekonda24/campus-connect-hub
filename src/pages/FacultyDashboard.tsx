import { Calendar, ClipboardCheck, MessageSquare, CheckCircle, Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockEvents, mockAttendanceRequests } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const approvedEvents = mockEvents.filter(e => e.status === 'approved');
  const approvedAttendance = mockAttendanceRequests.filter(r => r.status === 'approved' && userBranches.includes(r.branch));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground">
        <p className="text-primary-foreground/60 text-sm">Welcome back,</p>
        <h1 className="text-2xl md:text-3xl font-display mt-1">{user?.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {userBranches.map(b => (
            <span key={b} className="px-2 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground text-xs font-medium">{b}</span>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Approved Events', value: approvedEvents.length, icon: Calendar, color: 'text-success' },
          { label: 'Attendance Notifications', value: approvedAttendance.length, icon: Bell, color: 'text-info' },
          { label: 'Branches', value: userBranches.length, icon: ClipboardCheck, color: 'text-warning' },
        ].map(s => (
          <div key={s.label} className="campus-card p-4">
            <div className="flex items-center justify-between">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-2xl font-display text-foreground">{s.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Attendance Notifications */}
      <div>
        <h2 className="text-lg font-display text-foreground mb-3">Attendance Approvals (Your Branches)</h2>
        <div className="space-y-3">
          {approvedAttendance.map(req => (
            <div key={req.id} className="campus-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{req.studentName} — {req.eventName}</p>
                <p className="text-xs text-muted-foreground">{req.rollNumber} · {req.branch} · Approved for {req.eventDate}</p>
              </div>
            </div>
          ))}
          {approvedAttendance.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No attendance notifications</p>}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-gold hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {approvedEvents.slice(0, 4).map(event => (
            <div key={event.id} className="campus-card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-gold/30" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                <p className="text-xs text-muted-foreground">{event.date} · {event.venue} {event.branch && `· ${event.branch}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
