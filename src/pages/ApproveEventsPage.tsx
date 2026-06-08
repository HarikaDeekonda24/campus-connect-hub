import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, CheckCircle, XCircle, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Event { id: string; title: string; description?: string | null; date: string; time?: string | null; location?: string | null; branch?: string | null; }

export default function ApproveEventsPage() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase.from('events').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    query.then(({ data }) => {
      const all = data || [];
      setEvents(isAdmin ? all : all.filter(e => e.branch && userBranches.includes(e.branch)));
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, title: string, status: string) => {
    const { error } = await supabase.from('events').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(`Failed to ${status === 'approved' ? 'approve' : 'reject'}`);
    else {
      status === 'approved' ? toast.success(`"${title}" approved!`) : toast.info(`"${title}" rejected`);
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-foreground">Event Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">{isAdmin ? 'Review all pending events' : `Review events for: ${userBranches.join(', ')}`}</p>
      </div>
      {loading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="campus-card h-40 animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>All events reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-40 h-28 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-10 h-10 text-gold/30" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.branch && <span className="campus-badge-navy flex items-center gap-1"><GitBranch className="w-3 h-3" />{event.branch}</span>}
                    </div>
                    <span className="campus-badge bg-warning/10 text-warning flex-shrink-0">Pending</span>
                  </div>
                  <h3 className="text-base font-medium text-foreground mt-1">{event.title}</h3>
                  {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}{event.time ? ` at ${event.time}` : ''}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateStatus(event.id, event.title, 'approved')} className="px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => updateStatus(event.id, event.title, 'rejected')} className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
