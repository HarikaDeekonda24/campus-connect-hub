import { useState } from 'react';
import { Search, Filter, Calendar, MapPin, User, Grid3X3, List } from 'lucide-react';
import { mockEvents, Event } from '@/lib/mock-data';
import { motion } from 'framer-motion';

const categories = ['all', 'hackathon', 'workshop', 'seminar', 'club-event'] as const;

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const approved = mockEvents.filter(e => e.status === 'approved');
  const filtered = approved.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-foreground">Events & Hackathons</h1>
        <p className="text-muted-foreground text-sm mt-1">Discover what's happening on campus</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className="campus-input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${category === cat ? 'campus-gradient text-primary-foreground' : 'bg-card border text-foreground hover:bg-muted'}`}>
              {cat === 'all' ? 'All Events' : cat.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-1 border rounded-lg p-0.5 bg-card">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-muted' : ''}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-muted' : ''}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Events grid */}
      <div className={view === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
        {filtered.map((event, i) => (
          <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            {view === 'grid' ? <EventCard event={event} /> : <EventListItem event={event} />}
          </motion.div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No events found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="campus-card-hover overflow-hidden">
      <div className="h-40 campus-gradient relative flex items-center justify-center">
        <Calendar className="w-16 h-16 text-gold/20" />
        <span className="campus-badge-gold absolute top-3 left-3 capitalize">{event.category.replace('-', ' ')}</span>
        {event.featured && <span className="campus-badge-navy absolute top-3 right-3">Featured</span>}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-foreground text-base">{event.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        <div className="flex flex-col gap-1.5 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{event.date} at {event.time}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{event.venue}</span>
          <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{event.organizer}</span>
        </div>
        <button className="mt-4 w-full py-2 rounded-lg campus-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Register Now
        </button>
      </div>
    </div>
  );
}

function EventListItem({ event }: { event: Event }) {
  return (
    <div className="campus-card-hover flex gap-4 p-4">
      <div className="w-20 h-20 rounded-lg campus-gradient flex items-center justify-center flex-shrink-0">
        <Calendar className="w-8 h-8 text-gold/30" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-foreground">{event.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
          </div>
          <span className="campus-badge-gold capitalize flex-shrink-0">{event.category.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" />{event.organizer}</span>
        </div>
      </div>
      <button className="px-4 py-2 rounded-lg campus-gradient text-primary-foreground text-xs font-medium self-center hover:opacity-90 flex-shrink-0">Register</button>
    </div>
  );
}
