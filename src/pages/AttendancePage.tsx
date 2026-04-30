import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { ClipboardCheck, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type AttendanceRequest = Tables<'attendance_requests'>;
type Event = Tables<'events'>;

export default function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';
  const canApprove = isHod || isAdmin;
  const userBranch = user?.branches?.[0] || '';

  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    student_name: user?.name || '',
    roll_number: user?.rollNumber || '',
    event_id: '',
    proof: '',
  });

  useEffect(() => {
    fetchRequests();
    if (isStudent) fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('date', { ascending: true });
    if (data) setEvents(data);
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    let query = supabase.from('attendance_requests').select('*').order('created_at', { ascending: false });
    if (isStudent && user?.id) {
      query = query.eq('student_id', user.id);
    } else if (isHod && userBranch) {
      query = query.eq('branch', userBranch as any);
    }
    const { data, error } = await query;
    console.log('[AttendancePage] fetchRequests result:', data, 'error:', error);
    if (data) setRequests(data);
    setLoadingRequests(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) { toast.error('Not logged in'); return; }
    if (!form.event_id) { toast.error('Please select an event'); return; }

    const selectedEvent = events.find(ev => ev.id === form.event_id);
    const payload = {
      student_id: user.id,
      event_id: form.event_id,
      student_name: form.student_name || user.email,
      roll_number: form.roll_number,
      branch: (userBranch || 'CSE') as any,
      department: userBranch || 'CSE',
      proof: form.proof,
      status: 'pending',
    };

    console.log('[AttendancePage] submitting payload:', payload);
    setSubmitting(true);
    const { data, error } = await supabase.from('attendance_requests').insert(payload).select().single();
    console.log('[AttendancePage] insert result:', data, 'error:', error);
    setSubmitting(false);

    if (error) {
      toast.error(`Submission failed: ${error.message}`);
      return;
    }

    toast.success('Attendance request submitted!', { description: `Request for "${selectedEvent?.title}" sent to your HOD.` });
    setForm(prev => ({ ...prev, event_id: '', proof: '' }));
    fetchRequests();
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('attendance_requests').update({ status: 'approved' }).eq('id', id);
    console.log('[AttendancePage] approve error:', error);
    if (error) { toast.error('Failed to approve'); return; }
    toast.success('Request approved');
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase.from('attendance_requests').update({ status: 'rejected' }).eq('id', id);
    console.log('[AttendancePage] reject error:', error);
    if (error) { toast.error('Failed to reject'); return; }
    toast.info('Request rejected');
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="w-4 h-4 text-success" />;
    if (status === 'rejected') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-warning" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Attendance Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isStudent
            ? 'Request attendance permission for events'
            : isHod
            ? `Review attendance for: ${userBranch}`
            : 'View all attendance requests'}
        </p>
      </div>

      {isStudent && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
                onChange={e => setForm(prev => ({ ...prev, student_name: e.target.value }))}
                placeholder="Your full name"
                className="campus-input"
                data-testid="input-student-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Roll Number *</label>
              <input
                required
                value={form.roll_number}
                onChange={e => setForm(prev => ({ ...prev, roll_number: e.target.value }))}
                placeholder="e.g. 21A91A0501"
                className="campus-input"
                data-testid="input-roll-number"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Branch</label>
              <input
                value={userBranch}
                className="campus-input"
                readOnly
                data-testid="input-branch"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Event *</label>
              {events.length === 0 ? (
                <div className="campus-input text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  No approved events available
                </div>
              ) : (
                <select
                  required
                  value={form.event_id}
                  onChange={e => setForm(prev => ({ ...prev, event_id: e.target.value }))}
                  className="campus-input"
                  data-testid="select-event"
                >
                  <option value="">Select an event…</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} — {ev.date}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Proof / Registration Link *</label>
              <input
                required
                value={form.proof}
                onChange={e => setForm(prev => ({ ...prev, proof: e.target.value }))}
                placeholder="Paste registration link or describe your proof"
                className="campus-input"
                data-testid="input-proof"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting || events.length === 0}
            className="px-6 py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-attendance"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </motion.form>
      )}

      <div>
        <h2 className="font-display text-foreground mb-3">
          {isStudent ? 'Your Requests' : 'Attendance Requests'}
        </h2>

        {loadingRequests ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="campus-card h-16 animate-pulse" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div
                key={req.id}
                className="campus-card p-4 flex items-center justify-between gap-4"
                data-testid={`attendance-request-${req.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{req.student_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.roll_number} · {req.branch} · {req.department}
                    </p>
                    {req.proof && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">{req.proof}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusIcon(req.status)}
                  <span
                    className={`campus-badge capitalize ${
                      req.status === 'approved'
                        ? 'campus-badge-success'
                        : req.status === 'rejected'
                        ? 'campus-badge-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {req.status}
                  </span>
                  {canApprove && req.status === 'pending' && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20"
                        data-testid={`approve-attendance-${req.id}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
                        data-testid={`reject-attendance-${req.id}`}
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
