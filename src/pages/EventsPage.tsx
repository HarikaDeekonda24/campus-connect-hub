import { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Grid3X3, List, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  branch?: string | null;
  status: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('events')
      .select('id, title, description, date, time, location, branch, status')
      .eq('status', 'approved')
      .order('date', { ascending: true });

    if (err) {
      setError(err.message);
      setEvents([]);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  // ProtectedRoute guarantees auth is ready before this mounts,
  // so fetch unconditionally on mount — no user-state dependency needed.
  useEffect(() => {
    fetchEvents();
  }, []);

  const filtered = events.filter(e =>
    (e.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">Discover what's happening on campus</p>
        </div>
        <button
          onClick={fetchEvents}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="campus-input pl-9"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-0.5 bg-card">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-muted' : ''}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-muted' : ''}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load events</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
            <button onClick={fetchEvents} className="text-xs underline mt-1">Try again</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="campus-card animate-pulse h-48" />)}
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{search ? 'No events match your search' : 'No approved events yet'}</p>
          {!search && <p className="text-xs mt-1 opacity-70">Events posted by faculty and HODs will appear here</p>}
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              {view === 'grid' ? <EventCard event={event} /> : <EventListItem event={event} />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="campus-card overflow-hidden">
      <div className="h-40 campus-gradient relative flex items-center justify-center">
        <Calendar className="w-16 h-16 text-gold/20" />
        {event.branch && <span className="campus-badge-navy absolute top-3 right-3">{event.branch}</span>}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground text-base">{event.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        <div className="flex flex-col gap-1.5 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{event.date}{event.time ? ` at ${event.time}` : ''}</span>
          {event.location && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.location}</span>}
        </div>
      </div>
    </div>
  );
}

function EventListItem({ event }: { event: Event }) {
  return (
    <div className="campus-card flex gap-4 p-4">
      <div className="w-20 h-20 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
        <Calendar className="w-8 h-8 text-gold/30" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-foreground">{event.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
          </div>
          {event.branch && <span className="campus-badge-navy flex-shrink-0">{event.branch}</span>}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
        </div>
      </div>
    </div>
  );
}
