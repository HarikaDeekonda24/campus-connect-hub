import { useState } from 'react';
import { Calendar, MapPin, GitBranch, FileText, Clock, CheckCircle, Clock3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ALL_BRANCHES, Branch } from '@/lib/campus-types';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SubmitEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', location: '' });
  const [branch, setBranch] = useState<Branch | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const isPrivileged = user?.role === 'faculty' || user?.role === 'hod' || user?.role === 'admin';
  const eventStatus = isPrivileged ? 'approved' : 'pending';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Event title is required'); return; }
    if (!form.date) { toast.error('Date is required'); return; }
    if (!branch) { toast.error('Please select a branch'); return; }
    if (!user) { toast.error('Not logged in'); return; }

    setIsLoading(true);
    const { error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      date: form.date,
      time: form.time || null,
      location: form.location.trim() || null,
      branch,
      status: eventStatus,
      created_by: user.id,
    });

    if (error) {
      toast.error(`Failed to submit: ${error.message}`);
    } else if (isPrivileged) {
      toast.success('Event published!', { description: 'Your event is live and visible to all students.' });
      navigate('/events');
    } else {
      toast.success('Event submitted for approval!', { description: 'The HOD will review your event before it goes live.' });
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Submit an Event</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isPrivileged
            ? 'Your event will be published immediately and visible to all students.'
            : 'Share an event — it will be reviewed by the HOD before publishing.'}
        </p>
      </div>

      {/* Status preview banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
        isPrivileged
          ? 'bg-success/10 border-success/20 text-success'
          : 'bg-warning/10 border-warning/20 text-warning'
      }`}>
        {isPrivileged
          ? <><CheckCircle className="w-4 h-4 flex-shrink-0" /><span>As <strong>{user?.role}</strong>, your event will be <strong>published immediately</strong>.</span></>
          : <><Clock3 className="w-4 h-4 flex-shrink-0" /><span>As a <strong>student</strong>, your event will need <strong>HOD approval</strong> before going live.</span></>
        }
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="campus-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Event Title *</label>
            <input required value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Web Dev Bootcamp" className="campus-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block"><FileText className="w-3.5 h-3.5" /> Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us about the event..." rows={4} className="campus-input h-auto resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block"><Calendar className="w-3.5 h-3.5" /> Date *</label>
            <input required type="date" value={form.date} onChange={e => update('date', e.target.value)} className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block"><Clock className="w-3.5 h-3.5" /> Time</label>
            <input type="time" value={form.time} onChange={e => update('time', e.target.value)} className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block"><MapPin className="w-3.5 h-3.5" /> Location</label>
            <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Venue or online link" className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5 block"><GitBranch className="w-3.5 h-3.5" /> Branch *</label>
            <select required value={branch} onChange={e => setBranch(e.target.value as Branch)} className="campus-input">
              <option value="">Select branch</option>
              {ALL_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
        <div className="pt-1">
          <button type="submit" disabled={isLoading} className="w-full py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-60">
            {isLoading
              ? (isPrivileged ? 'Publishing…' : 'Submitting…')
              : (isPrivileged ? 'Publish Event' : 'Submit for Approval')}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
