import { Calendar, PlusCircle, ClipboardCheck, MapPin, MessageSquare, Bot, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { mockEvents } from '@/lib/mock-data';
import { motion } from 'framer-motion';

const quickActions = [
  { icon: Calendar, label: 'View Events', url: '/events', color: 'bg-info/10 text-info' },
  { icon: PlusCircle, label: 'Submit Event', url: '/submit-event', color: 'bg-success/10 text-success' },
  { icon: ClipboardCheck, label: 'Attendance', url: '/attendance', color: 'bg-warning/10 text-warning' },
  { icon: MapPin, label: 'Campus Map', url: '/campus-map', color: 'bg-accent/20 text-accent-foreground' },
  { icon: MessageSquare, label: 'Concerns', url: '/concerns', color: 'bg-destructive/10 text-destructive' },
  { icon: Bot, label: 'AI Assistant', url: '#chatbot', color: 'bg-primary/10 text-primary' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const approvedEvents = mockEvents.filter(e => e.status === 'approved');
  const featuredEvents = approvedEvents.filter(e => e.featured);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="campus-gradient rounded-2xl p-6 md:p-8 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-gold/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-primary-foreground/60 text-sm">Good morning,</p>
          <h1 className="text-2xl md:text-3xl font-display mt-1">{user?.name}</h1>
          <p className="text-primary-foreground/70 mt-2 text-sm">You have {approvedEvents.length} upcoming events this month</p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-display text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <motion.div key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={action.url} className="campus-card-hover flex flex-col items-center gap-2 p-4 text-center group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color} transition-transform group-hover:scale-110`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Featured events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display text-foreground">Featured Events</h2>
          <Link to="/events" className="text-sm text-gold hover:underline">View all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <div className="campus-card-hover overflow-hidden">
                <div className="h-36 campus-gradient relative flex items-center justify-center">
                  <Zap className="w-12 h-12 text-gold/30" />
                  <span className="campus-badge-gold absolute top-3 left-3">{event.category}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{event.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue}</span>
                  </div>
                  <Link to="/events" className="mt-3 block w-full text-center py-2 rounded-lg border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming Events', value: approvedEvents.length, icon: Calendar },
          { label: 'Registered', value: 2, icon: ClipboardCheck },
          { label: 'Pending Requests', value: 1, icon: Users },
          { label: 'Notifications', value: 3, icon: Zap },
        ].map(stat => (
          <div key={stat.label} className="campus-card p-4">
            <div className="flex items-center justify-between">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-display text-foreground">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
