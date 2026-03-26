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
  const [category, setCategory] = useState<string>('general');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    toast.success('Concern submitted anonymously');
    setMessage('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Anonymous Concerns</h1>
        <p className="text-muted-foreground text-sm mt-1">{isStudent ? 'Share your concerns anonymously — your identity is never recorded' : 'Review anonymous student concerns'}</p>
      </div>

      {isStudent && (
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="campus-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <ShieldOff className="w-4 h-4 flex-shrink-0" />
            <span>Your identity is not collected or stored with this submission</span>
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
        <h2 className="font-display text-foreground mb-3">{isStudent ? 'Note' : 'Submitted Concerns'}</h2>
        {isStudent ? (
          <p className="text-sm text-muted-foreground campus-card p-4">Your submitted concerns are reviewed by faculty and administration. You will not receive direct responses to maintain anonymity.</p>
        ) : (
          <div className="space-y-3">
            {mockConcerns.map(c => (
              <div key={c.id} className="campus-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="campus-badge-navy capitalize">{c.category.replace('-', ' ')}</span>
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
        )}
      </div>
    </div>
  );
}
