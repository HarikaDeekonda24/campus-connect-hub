import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockConcerns } from '@/lib/mock-data';
import { MessageSquare, Send, ShieldOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categories = ['academic', 'infrastructure', 'faculty-issue', 'general'] as const;

export default function ConcernsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isHod = user?.role === 'hod';
  const isAdmin = user?.role === 'admin';
  const canView = isHod || isAdmin;
  const userBranches = user?.branches || [];

  const [category, setCategory] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState<'hod' | 'admin'>('hod');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    toast.success(`Concern submitted anonymously to ${recipient === 'hod' ? 'HOD' : 'Student Welfare / Admin'}`);
    setMessage('');
  };

  // HOD sees concerns sent to HOD for their branches; Admin sees concerns sent to admin + all
  const visibleConcerns = canView
    ? mockConcerns.filter(c => {
        if (isAdmin) return c.recipient === 'admin' || true; // admin sees all
        if (isHod) return c.recipient === 'hod' && (!c.branch || userBranches.includes(c.branch));
        return false;
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Anonymous Concerns</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isStudent ? 'Share your concerns anonymously — your identity is never recorded' :
           user?.role === 'faculty' ? 'Anonymous concerns are only visible to HODs and Admins' :
           isHod ? `Viewing concerns for: ${userBranches.join(', ')}` : 'Review all anonymous student concerns'}
        </p>
      </div>

      {isStudent && (
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="campus-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <ShieldOff className="w-4 h-4 flex-shrink-0" />
            <span>Your identity is not collected or stored with this submission</span>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Send to</label>
            <div className="flex gap-2">
              {[
                { value: 'hod' as const, label: 'HOD (My Branch)' },
                { value: 'admin' as const, label: 'Student Welfare / Admin' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setRecipient(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${recipient === opt.value ? 'campus-gradient text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${category === cat ? 'campus-gradient text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'}`}>
                  {cat.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Your Concern *</label>
            <textarea required value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your concern..." rows={5} className="campus-input h-auto resize-none" />
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-lg campus-gradient text-primary-foreground font-medium text-sm hover:opacity-90 flex items-center gap-2">
            <Send className="w-4 h-4" /> Submit Anonymously
          </button>
        </motion.form>
      )}

      <div>
        {isStudent ? (
          <>
            <h2 className="font-display text-foreground mb-3">Note</h2>
            <p className="text-sm text-muted-foreground campus-card p-4">Your submitted concerns are reviewed by HOD or administration depending on your choice. You will not receive direct responses to maintain anonymity.</p>
          </>
        ) : user?.role === 'faculty' ? (
          <div className="text-center py-16 text-muted-foreground">
            <ShieldOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Anonymous concerns are not visible to faculty members.</p>
            <p className="text-xs mt-1">Only HODs and Admins can access student concerns.</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-foreground mb-3">Submitted Concerns</h2>
            <div className="space-y-3">
              {visibleConcerns.map(c => (
                <div key={c.id} className="campus-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="campus-badge-navy capitalize">{c.category.replace('-', ' ')}</span>
                      {c.branch && <span className="campus-badge-gold">{c.branch}</span>}
                      <span className={`campus-badge ${c.status === 'new' ? 'bg-warning/10 text-warning' : 'campus-badge-success'}`}>{c.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{c.message}</p>
                  {c.status === 'new' && (
                    <button onClick={() => toast.success('Marked as reviewed')} className="mt-3 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80">Mark as Reviewed</button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
