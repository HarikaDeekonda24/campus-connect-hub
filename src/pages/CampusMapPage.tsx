import { useState } from 'react';
import { Search, MapPin, Building2, BookOpen, Beaker, Coffee, Trophy } from 'lucide-react';
import { campusBuildings } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ElementType> = {
  academic: Building2, lab: Beaker, facility: BookOpen, admin: MapPin,
};

const buildingPositions: Record<string, { top: string; left: string }> = {
  'block-a': { top: '15%', left: '20%' },
  'block-b': { top: '15%', left: '55%' },
  'block-c': { top: '40%', left: '15%' },
  'library': { top: '40%', left: '50%' },
  'auditorium': { top: '40%', left: '78%' },
  'admin-block': { top: '65%', left: '25%' },
  'sports': { top: '65%', left: '60%' },
  'cafeteria': { top: '80%', left: '45%' },
};

export default function CampusMapPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const selectedBuilding = campusBuildings.find(b => b.id === selected);

  const filtered = campusBuildings.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.departments.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display text-foreground">Campus Map</h1>
        <p className="text-muted-foreground text-sm mt-1">Find buildings, departments, and classrooms</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search buildings, departments, rooms..." className="campus-input pl-9" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="campus-card p-4 relative" style={{ aspectRatio: '16/10' }}>
            <div className="absolute inset-4 rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 relative overflow-hidden">
              {/* Campus ground */}
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="absolute top-2 left-3 text-xs text-muted-foreground font-medium">Campus Layout</div>

              {/* Buildings */}
              {campusBuildings.map(building => {
                const pos = buildingPositions[building.id];
                const Icon = iconMap[building.type] || Building2;
                const isFiltered = filtered.includes(building);
                const isSelected = selected === building.id;
                return (
                  <button
                    key={building.id}
                    onClick={() => setSelected(building.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${isFiltered ? 'opacity-100' : 'opacity-30'} ${isSelected ? 'scale-125 z-10' : 'hover:scale-110'}`}
                    style={{ top: pos.top, left: pos.left }}
                  >
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-md ${isSelected ? 'campus-gradient-gold ring-2 ring-gold' : 'bg-card border'}`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-accent-foreground' : 'text-primary'}`} />
                      <span className="text-[8px] font-medium text-foreground leading-none">{building.name.length > 8 ? building.name.split(' ')[0] : building.name}</span>
                    </div>
                  </button>
                );
              })}

              {/* Paths */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.2 }}>
                <line x1="20%" y1="25%" x2="55%" y2="25%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
                <line x1="20%" y1="25%" x2="15%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
                <line x1="55%" y1="25%" x2="50%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
                <line x1="50%" y1="50%" x2="78%" y2="50%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
                <line x1="25%" y1="72%" x2="60%" y2="72%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
                <line x1="45%" y1="72%" x2="45%" y2="85%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeDasharray="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Building details sidebar */}
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {selectedBuilding ? (
              <motion.div key={selectedBuilding.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="campus-card p-5">
                <h3 className="font-display text-lg text-foreground">{selectedBuilding.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{selectedBuilding.type} · {selectedBuilding.floors} floors</p>
                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground mb-2">Departments</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.departments.map(d => (
                      <span key={d} className="campus-badge-navy">{d}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium text-foreground mb-2">Rooms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedBuilding.rooms.map(r => (
                      <span key={r} className="campus-badge bg-muted text-muted-foreground">{r}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="campus-card p-5 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click a building to see details</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Building list */}
          <div className="space-y-2">
            {filtered.map(b => {
              const Icon = iconMap[b.type] || Building2;
              return (
                <button key={b.id} onClick={() => setSelected(b.id)} className={`w-full text-left campus-card p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${selected === b.id ? 'ring-1 ring-gold' : ''}`}>
                  <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.departments.slice(0, 2).join(', ')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
