import { FileText, ClipboardCheck, MessageSquare, CheckCircle, XCircle, Calendar, Users, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockEvents, mockAttendanceRequests, mockConcerns } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function HODDashboard() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];

  const pendingEvents = mockEvents.filter(e => e.status === 'pending' && e.branch && userBranches.includes(e.branch));
  const pendingAttendance = mockAttendanceRequests.filter(r => r.status === 'pending' && userBranches.includes(r.branch));
  const branchConcerns = mockConcerns.filter(c => c.recipient === 'hod' && c.status === 'new' && (!c.branch || userBranches.includes(c.branch)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground">
        <p className="text-primary-foreground/60 text-sm">Head of Department</p>
        <h1 className="text-2xl md:text-3xl font-display mt-1">Welcome, {user?.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {userBranches.map(b => (
            <span key={b} className="px-2 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground text-xs font-medium">{b}</span>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Events', value: pendingEvents.length, icon: FileText, color: 'text-warning' },
          { label: 'Attendance Requests', value: pendingAttendance.length, icon: ClipboardCheck, color: 'text-info' },
          { label: 'Student Concerns', value: branchConcerns.length, icon: MessageSquare, color: 'text-destructive' },
          { label: 'Branches Managed', value: userBranches.length, icon: Shield, color: 'text-success' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
            <div className="flex items-center justify-between">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-2xl font-display text-foreground">{s.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Event Approvals</h2>
          <Link to="/approve-events" className="text-sm text-gold hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {pendingEvents.map(event => (
            <div key={event.id} className="campus-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-gold/30" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                  <p className="text-xs text-muted-foreground">{event.date} · {event.branch}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toast.success('Event approved!')} className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => toast.error('Event rejected')} className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Reject
                </button>
              </div>
            </div>
          ))}
          {pendingEvents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No pending events for your branches</p>}
        </div>
      </div>

      {/* Attendance Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Attendance Requests</h2>
          <Link to="/attendance" className="text-sm text-gold hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {pendingAttendance.map(req => (
            <div key={req.id} className="campus-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{req.studentName} — {req.eventName}</p>
                  <p className="text-xs text-muted-foreground">{req.rollNumber} · {req.branch} · {req.eventDate}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toast.success('Attendance approved! Faculty notified.')} className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20"><CheckCircle className="w-4 h-4" /></button>
                <button onClick={() => toast.error('Attendance rejected')} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {pendingAttendance.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No pending attendance requests</p>}
        </div>
      </div>

      {/* Anonymous Concerns */}
      <div>
        <h2 className="text-lg font-display text-foreground mb-3">Anonymous Student Concerns</h2>
        <div className="space-y-3">
          {branchConcerns.map(c => (
            <div key={c.id} className="campus-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="campus-badge-navy capitalize">{c.category.replace('-', ' ')}</span>
                {c.branch && <span className="campus-badge-gold">{c.branch}</span>}
                <span className="text-xs text-muted-foreground ml-auto">{c.date}</span>
              </div>
              <p className="text-sm text-foreground">{c.message}</p>
            </div>
          ))}
          {branchConcerns.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No concerns for your branches</p>}
        </div>
      </div>
    </div>
  );
}
