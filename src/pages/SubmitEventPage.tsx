import { useState } from 'react';
import { Upload, Calendar, MapPin, Link as LinkIcon, Users, Tag, GitBranch } from 'lucide-react';
import { ALL_BRANCHES } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SubmitEventPage() {
  const [form, setForm] = useState({
    name: '', description: '', date: '', time: '', location: '', organizer: '', category: 'workshop', registrationLink: '', branch: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Event submitted for approval!', { description: 'HOD of the related branch will review your event.' });
    setForm({ name: '', description: '', date: '', time: '', location: '', organizer: '', category: 'workshop', registrationLink: '', branch: '' });
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Submit an Event</h1>
        <p className="text-muted-foreground text-sm mt-1">Share an event with the campus community. It will be reviewed by the HOD before publishing.</p>
      </div>

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="campus-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Event Name *</label>
            <input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Web Dev Bootcamp" className="campus-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description *</label>
            <textarea required value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us about the event..." rows={4} className="campus-input h-auto resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Date *</label>
            <input required type="date" value={form.date} onChange={e => update('date', e.target.value)} className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Time *</label>
            <input required type="time" value={form.time} onChange={e => update('time', e.target.value)} className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Location *</label>
            <input required value={form.location} onChange={e => update('location', e.target.value)} placeholder="Venue or online link" className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Organizer *</label>
            <input required value={form.organizer} onChange={e => update('organizer', e.target.value)} placeholder="Club or department name" className="campus-input" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Category *</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} className="campus-input">
              <option value="hackathon">Hackathon</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="club-event">Club Event</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><GitBranch className="w-3.5 h-3.5" />Branch *</label>
            <select required value={form.branch} onChange={e => update('branch', e.target.value)} className="campus-input">
              <option value="">Select branch</option>
              {ALL_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" />Registration Link</label>
            <input value={form.registrationLink} onChange={e => update('registrationLink', e.target.value)} placeholder="https://..." className="campus-input" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Event Poster</label>
            <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>
        <button type="submit" className="w-full py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          Submit for Approval
        </button>
      </motion.form>
    </div>
  );
}
