import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockAttendanceRequests, ALL_BRANCHES } from '@/lib/mock-data';
import { ClipboardCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';
  const canApprove = isHod || isAdmin;
  const userBranches = user?.branches || [];

  const [form, setForm] = useState({
    studentName: user?.name || '', rollNumber: user?.rollNumber || '', branch: user?.branches?.[0] || '', eventName: '', eventDate: '', proof: ''
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Attendance request submitted!', { description: 'Your HOD will review it.' });
    setForm(prev => ({ ...prev, eventName: '', eventDate: '', proof: '' }));
  };

  // Filter requests by branch for HOD
  const filteredRequests = canApprove
    ? mockAttendanceRequests.filter(r => isAdmin || userBranches.includes(r.branch))
    : mockAttendanceRequests;

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
          {isStudent ? 'Request attendance permission for events' : isHod ? `Review attendance for: ${userBranches.join(', ')}` : 'View attendance requests'}
        </p>
      </div>

      {isStudent && (
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="campus-card p-6 space-y-4">
          <h2 className="font-display text-foreground">New Request</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Student Name</label>
              <input value={form.studentName} className="campus-input" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Roll Number</label>
              <input value={form.rollNumber} className="campus-input" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Branch</label>
              <input value={form.branch} className="campus-input" readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Event Name *</label>
              <input required value={form.eventName} onChange={e => update('eventName', e.target.value)} placeholder="Enter event name" className="campus-input" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Event Date *</label>
              <input required type="date" value={form.eventDate} onChange={e => update('eventDate', e.target.value)} className="campus-input" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Proof / Registration Link *</label>
              <input required value={form.proof} onChange={e => update('proof', e.target.value)} placeholder="Link or description" className="campus-input" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90">Submit Request</button>
        </motion.form>
      )}

      {/* Request list */}
      <div>
        <h2 className="font-display text-foreground mb-3">{isStudent ? 'Your Requests' : 'Attendance Requests'}</h2>
        <div className="space-y-3">
          {filteredRequests.map(req => (
            <div key={req.id} className="campus-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{req.eventName}</p>
                  <p className="text-xs text-muted-foreground">{req.studentName} · {req.rollNumber} · {req.branch} · {req.eventDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(req.status)}
                <span className={`campus-badge capitalize ${req.status === 'approved' ? 'campus-badge-success' : req.status === 'rejected' ? 'campus-badge-destructive' : 'bg-warning/10 text-warning'}`}>{req.status}</span>
                {canApprove && req.status === 'pending' && (
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => toast.success('Approved! Faculty of the branch have been notified.')} className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20"><CheckCircle className="w-4 h-4" /></button>
                    <button onClick={() => toast.error('Rejected')} className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
