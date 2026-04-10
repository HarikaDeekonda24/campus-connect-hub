import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Calendar, MapPin, CheckCircle, XCircle, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type Event = Tables<'events'>;

export default function ApproveEventsPage() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const isAdmin = user?.role === 'admin';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) {
      const filtered = isAdmin
        ? data
        : data.filter(e => e.branch && userBranches.includes(e.branch as any));
      setEvents(filtered);
    }
    setLoading(false);
  };

  const approve = async (id: string, title: string) => {
    const { error } = await supabase.from('events').update({ status: 'approved' }).eq('id', id);
    if (error) { toast.error('Failed to approve'); return; }
    toast.success(`"${title}" approved!`);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const reject = async (id: string, title: string) => {
    const { error } = await supabase.from('events').update({ status: 'rejected' }).eq('id', id);
    if (error) { toast.error('Failed to reject'); return; }
    toast.info(`"${title}" rejected`);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-foreground">Event Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? 'Review all pending student-submitted events' : `Review events for: ${userBranches.join(', ')}`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="campus-card h-40 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>All events have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="campus-card p-5"
              data-testid={`pending-event-${event.id}`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-40 h-28 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-10 h-10 text-gold/30" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {event.branch && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="campus-badge-navy flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />{event.branch}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-medium text-foreground">{event.title}</h3>
                    </div>
                    <span className="campus-badge bg-warning/10 text-warning flex-shrink-0">Pending</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.date}{event.time ? ` at ${event.time}` : ''}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{event.location}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      data-testid={`approve-event-${event.id}`}
                      onClick={() => approve(event.id, event.title)}
                      className="px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      data-testid={`reject-event-${event.id}`}
                      onClick={() => reject(event.id, event.title)}
                      className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center gap-1.5"
                    >
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
