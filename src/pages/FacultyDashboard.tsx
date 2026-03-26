import { Calendar, FileText, ClipboardCheck, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { mockEvents, mockAttendanceRequests, mockConcerns } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const pendingEvents = mockEvents.filter(e => e.status === 'pending');
  const pendingAttendance = mockAttendanceRequests.filter(r => r.status === 'pending');
  const newConcerns = mockConcerns.filter(c => c.status === 'new');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground">
        <p className="text-primary-foreground/60 text-sm">Welcome back,</p>
        <h1 className="text-2xl md:text-3xl font-display mt-1">{user?.name}</h1>
        <p className="text-primary-foreground/70 mt-2 text-sm">{pendingEvents.length} events awaiting your review</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Events', value: pendingEvents.length, icon: FileText, color: 'text-warning' },
          { label: 'Attendance Requests', value: pendingAttendance.length, icon: ClipboardCheck, color: 'text-info' },
          { label: 'New Concerns', value: newConcerns.length, icon: MessageSquare, color: 'text-destructive' },
          { label: 'Total Approved', value: mockEvents.filter(e => e.status === 'approved').length, icon: CheckCircle, color: 'text-success' },
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

      {/* Pending events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Pending Event Approvals</h2>
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
                  <p className="text-xs text-muted-foreground">{event.date} · {event.organizer}</p>
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
          {pendingEvents.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No pending events</p>}
        </div>
      </div>

      {/* Recent concerns */}
      <div>
        <h2 className="text-lg font-display text-foreground mb-3">Recent Anonymous Concerns</h2>
        <div className="space-y-3">
          {newConcerns.slice(0, 3).map(c => (
            <div key={c.id} className="campus-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="campus-badge-navy capitalize">{c.category.replace('-', ' ')}</span>
                <span className="text-xs text-muted-foreground">{c.date}</span>
              </div>
              <p className="text-sm text-foreground">{c.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
