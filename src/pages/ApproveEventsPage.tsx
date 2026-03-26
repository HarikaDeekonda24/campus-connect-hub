import { useAuth } from '@/lib/auth-context';
import { mockEvents } from '@/lib/mock-data';
import { Calendar, MapPin, User, CheckCircle, XCircle, Edit, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ApproveEventsPage() {
  const { user } = useAuth();
  const userBranches = user?.branches || [];
  const isAdmin = user?.role === 'admin';

  // HODs see events for their branches; Admin sees all pending
  const pendingEvents = mockEvents.filter(e =>
    e.status === 'pending' && (isAdmin || (e.branch && userBranches.includes(e.branch)))
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-foreground">Event Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? 'Review all pending student-submitted events' : `Review events for: ${userBranches.join(', ')}`}
        </p>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>All events have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="campus-card p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-40 h-28 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-10 h-10 text-gold/30" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="campus-badge-gold capitalize">{event.category.replace('-', ' ')}</span>
                        {event.branch && <span className="campus-badge-navy flex items-center gap-1"><GitBranch className="w-3 h-3" />{event.branch}</span>}
                      </div>
                      <h3 className="text-lg font-medium text-foreground">{event.title}</h3>
                    </div>
                    <span className="campus-badge bg-warning/10 text-warning">Pending</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date} at {event.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.organizer}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => toast.success(`"${event.title}" approved!`)} className="px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => toast.error(`"${event.title}" rejected`)} className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors flex items-center gap-1.5">
                      <Edit className="w-4 h-4" /> Edit
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
