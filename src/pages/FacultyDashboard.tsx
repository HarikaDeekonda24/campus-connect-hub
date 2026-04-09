import { useState, useEffect } from 'react';
import { Calendar, ClipboardCheck, CircleCheck as CheckCircle, Circle as XCircle, Clock, Bell, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type AttendanceRequest = Tables<'attendance_requests'>;
type Event = Tables<'events'>;

export default function FacultyDashboard() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];

  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [reqRes, evtRes] = await Promise.all([
      supabase
        .from('attendance_requests')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('date', { ascending: true })
        .limit(5),
    ]);
    if (reqRes.data) setRequests(reqRes.data);
    if (evtRes.data) setEvents(evtRes.data);
    setLoading(false);
  };

  const branchRequests = requests.filter(r =>
    userBranches.includes(r.branch as any)
  );

  const pending = branchRequests.filter(r => r.status === 'pending');
  const approved = branchRequests.filter(r => r.status === 'approved');

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'campus-badge-success';
    if (status === 'rejected') return 'campus-badge-destructive';
    return 'campus-badge bg-warning/10 text-warning';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-gold/10 -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-sm">Faculty Dashboard</p>
          <h1 className="text-2xl md:text-3xl font-display mt-1">{user?.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {userBranches.map(b => (
              <span key={b} className="px-2 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground text-xs font-medium">{b}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests', value: branchRequests.length, icon: ClipboardCheck, color: 'text-info' },
          { label: 'Pending Review', value: pending.length, icon: Clock, color: 'text-warning' },
          { label: 'Approved', value: approved.length, icon: CheckCircle, color: 'text-success' },
          { label: 'Branches', value: userBranches.length, icon: Users, color: 'text-primary' },
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

      {/* Students Needing Attendance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            Students Needing Attendance
            {pending.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-semibold">{pending.length}</span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="campus-card p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="campus-card p-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending attendance requests for your branches.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((req, i) => {
              const event = events.find(e => e.id === req.event_id);
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="campus-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-warning text-sm font-semibold">{req.student_name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">{req.student_name}</p>
                        <p className="text-xs text-muted-foreground">{req.roll_number} &middot; {req.branch} &middot; {req.department}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Event: <span className="text-foreground">{event?.title || req.event_id}</span> &middot; {req.created_at.slice(0, 10)}
                        </p>
                        {req.proof && (
                          <p className="text-xs text-muted-foreground mt-1">Proof: <span className="text-foreground">{req.proof.slice(0, 60)}{req.proof.length > 60 ? '...' : ''}</span></p>
                        )}
                      </div>
                    </div>
                    <span className={`campus-badge flex items-center gap-1 flex-shrink-0 ${statusBadge(req.status)}`}>
                      {statusIcon(req.status)}
                      <span className="capitalize">{req.status}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Branch Requests */}
      {branchRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-display text-foreground mb-3">All Attendance Requests — Your Branches</h2>
          <div className="space-y-2">
            {branchRequests.map(req => {
              const event = events.find(e => e.id === req.event_id);
              return (
                <div key={req.id} className="campus-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-semibold text-muted-foreground">
                      {req.student_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{req.student_name} — {event?.title || 'Event'}</p>
                      <p className="text-xs text-muted-foreground">{req.roll_number} &middot; {req.branch} &middot; {req.created_at.slice(0, 10)}</p>
                    </div>
                  </div>
                  <span className={`campus-badge flex items-center gap-1 flex-shrink-0 ${statusBadge(req.status)}`}>
                    {statusIcon(req.status)}
                    <span className="capitalize">{req.status}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-gold hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
        </div>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="campus-card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-gold/30" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                <p className="text-xs text-muted-foreground">{event.date} &middot; {event.venue}{event.branch ? ` · ${event.branch}` : ''}</p>
              </div>
              {event.branch && <span className="campus-badge-navy flex-shrink-0">{event.branch}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
