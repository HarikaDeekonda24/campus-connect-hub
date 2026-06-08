import { useState, useEffect } from 'react';
import { FileText, ClipboardCheck, CheckCircle, XCircle, Calendar, MapPin, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type Tab = 'overview' | 'approvals' | 'attendance';
interface Event { id: string; title: string; description?: string | null; date: string; time?: string | null; location?: string | null; branch?: string | null; }
interface AttendanceRequest { id: string; student_name: string; roll_number: string; branch: string; department: string; proof: string; status: string; created_at: string; }

export default function HODDashboard() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [evtRes, pendingEvtRes, attRes] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'approved').order('date').limit(5),
      supabase.from('events').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('attendance_requests').select('*').in('branch', userBranches).order('created_at', { ascending: false }),
    ]);
    setUpcomingEvents(evtRes.data || []);
    setPendingEvents(pendingEvtRes.data || []);
    setAttendanceRequests(attRes.data || []);
    setLoading(false);
  };

  const approveEvent = async (id: string, title: string) => {
    await supabase.from('events').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id);
    toast.success(`"${title}" approved!`);
    setPendingEvents(p => p.filter(e => e.id !== id));
  };
  const rejectEvent = async (id: string, title: string) => {
    await supabase.from('events').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id);
    toast.info(`"${title}" rejected`);
    setPendingEvents(p => p.filter(e => e.id !== id));
  };
  const updateAttendance = async (id: string, status: string, name: string) => {
    await supabase.from('attendance_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success(`${name}'s request ${status}`);
    setAttendanceRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
  };

  const pendingAttendance = attendanceRequests.filter(r => r.status === 'pending');
  const tabs = [
    { key: 'overview' as Tab, label: 'Overview', icon: Shield, badge: 0 },
    { key: 'approvals' as Tab, label: 'Event Approvals', icon: FileText, badge: pendingEvents.length },
    { key: 'attendance' as Tab, label: 'Attendance Requests', icon: ClipboardCheck, badge: pendingAttendance.length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-gold/10 -translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-sm">Head of Department</p>
          <h1 className="text-2xl md:text-3xl font-display mt-1">Welcome, {user?.name}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            {userBranches.map(b => <span key={b} className="px-2 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground text-xs font-medium">{b}</span>)}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Events', value: pendingEvents.length, icon: FileText, color: 'text-warning' },
          { label: 'Pending Attendance', value: pendingAttendance.length, icon: ClipboardCheck, color: 'text-info' },
          { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: 'text-success' },
          { label: 'Branches Managed', value: userBranches.length, icon: Shield, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
            <div className="flex items-center justify-between"><s.icon className={`w-4 h-4 ${s.color}`} /><span className="text-2xl font-display text-foreground">{s.value}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
            {tab.badge > 0 && <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <h2 className="text-lg font-display text-foreground mb-3">Upcoming Approved Events</h2>
          {loading ? <p className="text-muted-foreground text-sm">Loading...</p>
          : upcomingEvents.length === 0 ? <div className="text-center py-12 text-muted-foreground"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No upcoming events.</p></div>
          : <div className="space-y-3">{upcomingEvents.map(event => (
            <div key={event.id} className="campus-card p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0"><Calendar className="w-6 h-6 text-gold/30" /></div>
              <div className="min-w-0 flex-1"><h3 className="font-medium text-foreground truncate">{event.title}</h3><p className="text-xs text-muted-foreground">{event.date}{event.location ? ` · ${event.location}` : ''}{event.branch ? ` · ${event.branch}` : ''}</p></div>
              {event.branch && <span className="campus-badge-navy flex-shrink-0">{event.branch}</span>}
            </div>
          ))}</div>}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <h2 className="text-lg font-display text-foreground">Pending Event Approvals</h2>
          {loading ? <p className="text-muted-foreground text-sm">Loading...</p>
          : pendingEvents.length === 0 ? <div className="text-center py-16 text-muted-foreground"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>All events reviewed!</p></div>
          : <div className="space-y-4">{pendingEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-28 h-24 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0"><Calendar className="w-8 h-8 text-gold/30" /></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">{event.branch && <span className="campus-badge-navy">{event.branch}</span>}</div>
                    <span className="campus-badge bg-warning/10 text-warning flex-shrink-0">Pending</span>
                  </div>
                  <h3 className="text-base font-medium text-foreground">{event.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}{event.time ? ` at ${event.time}` : ''}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => approveEvent(event.id, event.title)} className="px-4 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Approve</button>
                    <button onClick={() => rejectEvent(event.id, event.title)} className="px-4 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Reject</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}</div>}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-display text-foreground">Attendance Requests — {userBranches.join(', ')}</h2>
          {loading ? <p className="text-muted-foreground text-sm">Loading...</p>
          : attendanceRequests.length === 0 ? <div className="text-center py-16 text-muted-foreground"><ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No attendance requests.</p></div>
          : <div className="space-y-3">{attendanceRequests.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-semibold text-muted-foreground">{req.student_name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{req.student_name}</p>
                    <p className="text-xs text-muted-foreground">{req.roll_number} · {req.branch} · {req.created_at?.slice(0, 10)}</p>
                    <p className="text-xs text-muted-foreground truncate">Proof: {req.proof}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => updateAttendance(req.id, 'approved', req.student_name)} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20"><CheckCircle className="w-4 h-4" /></button>
                      <button onClick={() => updateAttendance(req.id, 'rejected', req.student_name)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <span className={`campus-badge flex items-center gap-1 ${req.status === 'approved' ? 'campus-badge-success' : 'campus-badge-destructive'}`}>
                      {req.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span className="capitalize">{req.status}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}</div>}
        </div>
      )}
    </div>
  );
}
