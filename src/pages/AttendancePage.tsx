import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardCheck, Clock, CheckCircle, XCircle, Calendar, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Event { id: string; title: string; date: string; }
interface AttendanceRequest {
  id: string;
  student_id: string;
  event_id?: string | null;
  event_name?: string | null;
  event_date?: string | null;
  student_name: string;
  roll_number: string;
  branch: string;
  department: string;
  proof_url: string;
  status: string;
  created_at: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canApprove = user?.role === 'hod' || user?.role === 'admin' || user?.role === 'faculty';

  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    student_name: user?.name || '',
    roll_number: user?.rollNumber || '',
    event_id: '',
    proof_url: '',
  });

  useEffect(() => {
    fetchRequests();
    if (isStudent) {
      supabase
        .from('events')
        .select('id, title, date')
        .eq('status', 'approved')
        .order('date')
        .then(({ data }) => setEvents(data || []));
    }
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('attendance_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (isStudent && user?.id) {
      query = query.eq('student_id', user.id);
    } else if (user?.role === 'hod' && (user.branches?.length ?? 0) > 0) {
      query = query.in('branch', user.branches!);
    } else if (user?.role === 'faculty' && (user.branches?.length ?? 0) > 0) {
      query = query.in('branch', user.branches!);
    }

    const { data, error } = await query;
    if (error) toast.error(`Failed to load requests: ${error.message}`);
    setRequests(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Not logged in'); return; }
    if (!form.event_id) { toast.error('Please select an event'); return; }
    if (!form.proof_url.trim()) { toast.error('Please enter proof URL or description'); return; }

    const selectedEvent = events.find(ev => ev.id === form.event_id);
    if (!selectedEvent) { toast.error('Invalid event selected'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('attendance_requests').insert({
      student_id: user.id,
      event_id: form.event_id,
      event_name: selectedEvent.title,
      event_date: selectedEvent.date,
      student_name: form.student_name || user.name,
      roll_number: form.roll_number,
      branch: user.branches?.[0] || '',
      department: user.department || '',
      proof_url: form.proof_url.trim(),
      status: 'pending',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast.error(`Submission failed: ${error.message}`);
    } else {
      toast.success('Attendance request submitted!', {
        description: `Request for "${selectedEvent.title}" sent to your HOD for review.`,
      });
      setForm(p => ({ ...p, event_id: '', proof_url: '' }));
      fetchRequests();
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('attendance_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(`Request ${status}`);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const statusIcon = (s: string) =>
    s === 'approved' ? <CheckCircle className="w-4 h-4 text-success" /> :
    s === 'rejected' ? <XCircle className="w-4 h-4 text-destructive" /> :
    <Clock className="w-4 h-4 text-warning" />;

  const statusBadge = (s: string) =>
    s === 'approved' ? 'campus-badge-success' :
    s === 'rejected' ? 'campus-badge-destructive' :
    'campus-badge bg-warning/10 text-warning';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Attendance Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isStudent ? 'Submit an attendance request for an approved event' : 'Review attendance requests from your branch'}
        </p>
      </div>

      {isStudent && (
        <motion.form
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="campus-card p-6 space-y-4"
        >
          <h2 className="font-display text-foreground">New Request</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Student Name *</label>
              <input
                required
                value={form.student_name}
                onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))}
                placeholder="Your full name"
                className="campus-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Roll Number *</label>
              <input
                required
                value={form.roll_number}
                onChange={e => setForm(p => ({ ...p, roll_number: e.target.value }))}
                placeholder="e.g. 21A91A0501"
                className="campus-input"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Branch</label>
              <input value={user?.branches?.[0] || 'Not set'} className="campus-input bg-muted/30" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block">
                <Calendar className="w-3.5 h-3.5" /> Event *
              </label>
              {events.length === 0 ? (
                <div className="campus-input text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> No approved events available
                </div>
              ) : (
                <select
                  required
                  value={form.event_id}
                  onChange={e => setForm(p => ({ ...p, event_id: e.target.value }))}
                  className="campus-input"
                >
                  <option value="">Select an event…</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} — {ev.date}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block">
                <Link2 className="w-3.5 h-3.5" /> Proof URL / Registration Link *
              </label>
              <input
                required
                value={form.proof_url}
                onChange={e => setForm(p => ({ ...p, proof_url: e.target.value }))}
                placeholder="Paste registration link, certificate URL, or describe your proof"
                className="campus-input"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || events.length === 0}
            className="px-6 py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </motion.form>
      )}

      <div>
        <h2 className="font-display text-foreground mb-3">
          {isStudent ? 'Your Requests' : 'Attendance Requests'}
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="campus-card h-20 animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="campus-card p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm">{req.student_name}</p>
                    <p className="text-xs text-muted-foreground">{req.roll_number} · {req.branch}</p>
                    {(req.event_name) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="text-foreground">{req.event_name}</span>
                        {req.event_date ? ` · ${req.event_date}` : ''}
                      </p>
                    )}
                    {req.proof_url && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                        Proof: {req.proof_url}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusIcon(req.status)}
                  <span className={`campus-badge capitalize ${statusBadge(req.status)}`}>{req.status}</span>
                  {canApprove && req.status === 'pending' && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => updateStatus(req.id, 'approved')}
                        className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, 'rejected')}
                        className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
