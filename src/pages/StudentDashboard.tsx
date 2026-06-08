import { useState, useEffect } from 'react';
import { Calendar, MapPin, ClipboardCheck, PlusCircle, MessageSquare, Zap, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Event { id: string; title: string; description?: string | null; date: string; time?: string | null; location?: string | null; branch?: string | null; }
interface AttendanceRequest { id: string; student_id: string; event_id?: string | null; status: string; created_at: string; }

function AttendanceModal({ event, onClose, onSubmit }: { event: Event; onClose: () => void; onSubmit: (proof: string) => Promise<void> }) {
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proof.trim()) return;
    setLoading(true);
    await onSubmit(proof);
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-display text-foreground mb-1">Request Attendance</h2>
        <p className="text-sm text-muted-foreground mb-4">for <span className="font-medium text-foreground">{event.title}</span></p>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Proof / Registration Link *</label>
            <textarea required value={proof} onChange={e => setProof(e.target.value)} placeholder="Paste registration link or describe your proof..." rows={3} className="campus-input h-auto resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border bg-background text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            <button type="submit" disabled={loading || !proof.trim()} className="flex-1 h-10 rounded-lg campus-gradient text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRequests, setMyRequests] = useState<AttendanceRequest[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    supabase.from('events').select('*').eq('status', 'approved').order('date').then(({ data }) => { setEvents(data || []); setLoadingEvents(false); });
    if (user?.id) supabase.from('attendance_requests').select('*').eq('student_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setMyRequests(data || []));
  }, [user?.id]);

  const handleAttendanceRequest = async (proof: string) => {
    if (!selectedEvent || !user) return;
    if (myRequests.some(r => r.event_id === selectedEvent.id)) {
      toast.error('Already submitted a request for this event.');
      setSelectedEvent(null);
      return;
    }
    const { error } = await supabase.from('attendance_requests').insert({
      student_id: user.id,
      event_id: selectedEvent.id,
      student_name: user.name,
      roll_number: user.rollNumber || '',
      branch: user.branches?.[0] || 'CSE',
      department: user.department || '',
      proof,
    });
    if (error) toast.error('Failed to submit. Please try again.');
    else {
      toast.success('Attendance request submitted!', { description: 'Your HOD will review it.' });
      const { data } = await supabase.from('attendance_requests').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
      setMyRequests(data || []);
    }
    setSelectedEvent(null);
  };

  const requestedEventIds = new Set(myRequests.map(r => r.event_id).filter(Boolean));

  const statusBadge = (s: string) => s === 'approved'
    ? <span className="campus-badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>
    : s === 'rejected'
    ? <span className="campus-badge-destructive flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
    : <span className="flex items-center gap-1 campus-badge bg-warning/10 text-warning"><Clock className="w-3 h-3" />Pending</span>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AnimatePresence>
        {selectedEvent && <AttendanceModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onSubmit={handleAttendanceRequest} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-gold/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-sm">Good morning,</p>
          <h1 className="text-2xl md:text-3xl font-display mt-1">{user?.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-primary-foreground/70 text-sm">{events.length} approved events</p>
            {user?.branches?.[0] && <span className="px-2 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground text-xs font-medium">{user.branches[0]}</span>}
          </div>
        </div>
      </motion.div>

      <div>
        <h2 className="text-lg font-display text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { icon: Calendar, label: 'View Events', url: '/events', color: 'bg-info/10 text-info' },
            { icon: PlusCircle, label: 'Submit Event', url: '/submit-event', color: 'bg-success/10 text-success' },
            { icon: ClipboardCheck, label: 'Attendance', url: '/attendance', color: 'bg-warning/10 text-warning' },
            { icon: MapPin, label: 'Campus Map', url: '/campus-map', color: 'bg-accent/20 text-accent-foreground' },
            { icon: MessageSquare, label: 'Concerns', url: '/concerns', color: 'bg-destructive/10 text-destructive' },
          ].map((a, i) => (
            <motion.div key={a.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={a.url} className="campus-card-hover flex flex-col items-center gap-2 p-4 text-center group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} transition-transform group-hover:scale-110`}><a.icon className="w-5 h-5" /></div>
                <span className="text-xs font-medium text-foreground">{a.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-gold hover:underline flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></Link>
        </div>
        {loadingEvents ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="campus-card overflow-hidden animate-pulse"><div className="h-36 bg-muted" /><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /></div></div>)}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground campus-card"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No approved events.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event, i) => {
              const alreadyRequested = requestedEventIds.has(event.id);
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="campus-card overflow-hidden flex flex-col h-full">
                    <div className="h-36 campus-gradient relative flex items-center justify-center flex-shrink-0">
                      <Zap className="w-12 h-12 text-gold/20" />
                      {event.branch && <span className="campus-badge-navy absolute top-3 right-3">{event.branch}</span>}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{event.description}</p>
                      <div className="flex flex-col gap-1 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{event.date}{event.time ? ` at ${event.time}` : ''}</span>
                        {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.location}</span>}
                      </div>
                      <button onClick={() => !alreadyRequested && setSelectedEvent(event)} disabled={alreadyRequested}
                        className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all ${alreadyRequested ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'campus-gradient text-primary-foreground hover:opacity-90'}`}>
                        {alreadyRequested ? 'Attendance Requested' : 'Request Attendance'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {myRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-display text-foreground mb-3">My Attendance Requests</h2>
          <div className="space-y-2">
            {myRequests.map(req => {
              const event = events.find(e => e.id === req.event_id);
              return (
                <div key={req.id} className="campus-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><ClipboardCheck className="w-4 h-4 text-muted-foreground" /></div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event?.title || 'Event'}</p>
                      <p className="text-xs text-muted-foreground">{req.created_at?.slice(0, 10)}</p>
                    </div>
                  </div>
                  {statusBadge(req.status)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Approved Events', value: events.length, icon: Calendar },
          { label: 'My Requests', value: myRequests.length, icon: ClipboardCheck },
          { label: 'Pending', value: myRequests.filter(r => r.status === 'pending').length, icon: Clock },
          { label: 'Approved', value: myRequests.filter(r => r.status === 'approved').length, icon: CheckCircle },
        ].map(s => (
          <div key={s.label} className="campus-card p-4">
            <div className="flex items-center justify-between"><s.icon className="w-4 h-4 text-muted-foreground" /><span className="text-2xl font-display text-foreground">{s.value}</span></div>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
