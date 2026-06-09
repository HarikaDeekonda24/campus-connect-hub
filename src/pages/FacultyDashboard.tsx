import { useState, useEffect } from 'react';
import { Calendar, ClipboardCheck, CheckCircle, XCircle, Clock, Bell, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AttendanceRequest {
  id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  department: string;
  event_name?: string | null;
  event_date?: string | null;
  proof_url?: string | null;
  status: string;
  created_at: string;
}
interface Event { id: string; title: string; date: string; location?: string | null; branch?: string | null; }
interface Notification { id: string; message: string; type: string; read: boolean; created_at: string; }

export default function FacultyDashboard() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const branchQuery = userBranches.length > 0
      ? supabase.from('attendance_requests').select('*').in('branch', userBranches).order('created_at', { ascending: false })
      : supabase.from('attendance_requests').select('*').order('created_at', { ascending: false });

    Promise.all([
      branchQuery,
      supabase.from('events').select('id, title, date, location, branch').eq('status', 'approved').order('date').limit(5),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
    ]).then(([attRes, evtRes, notifRes]) => {
      setRequests(attRes.data || []);
      setEvents(evtRes.data || []);
      setNotifications(notifRes.data || []);
      setLoading(false);
    });
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (!unreadIds.length) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const pending = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const unreadCount = notifications.filter(n => !n.read).length;

  const statusIcon = (s: string) =>
    s === 'approved' ? <CheckCircle className="w-4 h-4 text-success" /> :
    s === 'rejected' ? <XCircle className="w-4 h-4 text-destructive" /> :
    <Clock className="w-4 h-4 text-warning" />;

  const statusBadge = (s: string) =>
    s === 'approved' ? 'campus-badge-success' :
    s === 'rejected' ? 'campus-badge-destructive' :
    'campus-badge bg-warning/10 text-warning';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests', value: requests.length, icon: ClipboardCheck, color: 'text-info' },
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

      {/* Notifications */}
      {notifications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{unreadCount}</span>
              )}
            </h2>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`campus-card p-3 flex items-start gap-3 cursor-pointer transition-colors ${n.read ? 'opacity-60' : 'border-gold/30 bg-gold/5'}`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-muted-foreground/30' : 'bg-gold'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.created_at?.slice(0, 10)}</p>
                </div>
                {!n.read && <span className="text-xs text-gold font-medium flex-shrink-0">New</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Attendance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            Pending Attendance
            {pending.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-semibold">{pending.length}</span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="campus-card p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2"><div className="h-3 bg-muted rounded w-1/2" /><div className="h-3 bg-muted rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="campus-card p-8 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending requests for your branches.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="campus-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-warning text-sm font-semibold">{req.student_name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{req.student_name}</p>
                      <p className="text-xs text-muted-foreground">{req.roll_number} · {req.branch} · {req.created_at?.slice(0, 10)}</p>
                      {req.event_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Event: <span className="text-foreground">{req.event_name}</span>
                          {req.event_date ? ` · ${req.event_date}` : ''}
                        </p>
                      )}
                      {req.proof_url && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                          Proof: {req.proof_url}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`campus-badge flex items-center gap-1 flex-shrink-0 ${statusBadge(req.status)}`}>
                    {statusIcon(req.status)}
                    <span className="capitalize">{req.status}</span>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* All Requests */}
      {requests.length > 0 && (
        <div>
          <h2 className="text-lg font-display text-foreground mb-3">All Attendance Requests</h2>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className="campus-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-semibold text-muted-foreground">
                    {req.student_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {req.student_name}{req.event_name ? ` — ${req.event_name}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{req.roll_number} · {req.branch} · {req.created_at?.slice(0, 10)}</p>
                  </div>
                </div>
                <span className={`campus-badge flex items-center gap-1 flex-shrink-0 ${statusBadge(req.status)}`}>
                  {statusIcon(req.status)}
                  <span className="capitalize">{req.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-gold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="campus-card p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-gold/30" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                <p className="text-xs text-muted-foreground">{event.date}{event.location ? ` · ${event.location}` : ''}{event.branch ? ` · ${event.branch}` : ''}</p>
              </div>
              {event.branch && <span className="campus-badge-navy flex-shrink-0">{event.branch}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
