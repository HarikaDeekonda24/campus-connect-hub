import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Search, MapPin, Building2, BookOpen, Beaker, Coffee, Trophy,
  Car, Home, ShieldCheck, DoorOpen, Sparkles, Navigation, X,
  ZoomIn, ZoomOut, Maximize2, Clock, Route as RouteIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import campusImage from '@/assets/campus-layout.png.asset.json';
import { campusLocations, type CampusLocation, type LocationType } from '@/lib/campus-map-data';
import { findRoute, type RouteResult } from '@/lib/campus-pathfinding';

const iconMap: Record<LocationType, React.ElementType> = {
  academic: Building2,
  lab: Beaker,
  library: BookOpen,
  hostel: Home,
  admin: ShieldCheck,
  sports: Trophy,
  facility: Coffee,
  parking: Car,
  landmark: Sparkles,
  gate: DoorOpen,
};

const typeColors: Record<LocationType, string> = {
  academic: 'bg-[hsl(var(--navy))] text-primary-foreground',
  lab: 'bg-[hsl(var(--info))] text-white',
  library: 'bg-pink-500 text-white',
  hostel: 'bg-emerald-600 text-white',
  admin: 'bg-[hsl(var(--navy-light))] text-white',
  sports: 'bg-orange-500 text-white',
  facility: 'bg-amber-500 text-white',
  parking: 'bg-slate-500 text-white',
  landmark: 'bg-[hsl(var(--gold))] text-accent-foreground',
  gate: 'bg-rose-500 text-white',
};

export default function CampusMapPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [tab, setTab] = useState<'details' | 'route'>('details');

  // Zoom + pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campusLocations;
    return campusLocations.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.type.includes(q) ||
      (l.aliases || []).some(a => a.toLowerCase().includes(q))
    );
  }, [search]);

  const selected = campusLocations.find(l => l.id === selectedId) || null;

  const focusOn = useCallback((loc: CampusLocation) => {
    setSelectedId(loc.id);
    setTab('details');
    // Center the location: shift pan so loc.x,y lands at 50,50
    setZoom(z => Math.max(z, 1.6));
    const targetZoom = Math.max(zoom, 1.6);
    const dx = (50 - loc.x) * targetZoom;
    const dy = (50 - loc.y) * targetZoom;
    setPan({ x: dx, y: dy });
  }, [zoom]);

  const onShowRoute = () => {
    if (!fromId || !toId) return;
    const r = findRoute(fromId, toId);
    setRoute(r);
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Pan handlers
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.y) / rect.height) * 100;
    setPan({ x: dragRef.current.px + dx, y: dragRef.current.py + dy });
  };
  const onMouseUp = () => { dragRef.current = null; };

  // Touch support
  const touchRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, px: pan.x, py: pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current || !mapRef.current) return;
    const t = e.touches[0];
    const rect = mapRef.current.getBoundingClientRect();
    const dx = ((t.clientX - touchRef.current.x) / rect.width) * 100;
    const dy = ((t.clientY - touchRef.current.y) / rect.height) * 100;
    setPan({ x: touchRef.current.px + dx, y: touchRef.current.py + dy });
  };
  const onTouchEnd = () => { touchRef.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.15 : -0.15))));
  };

  // SVG route polyline path coordinates (percent in image space)
  const routeLine = route?.path.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-foreground">GNITS Campus Map</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Interactive map of G. Narayanamma Institute of Technology &amp; Science
          </p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search buildings, labs, hostels, landmarks…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* Map */}
        <div className="rounded-2xl border bg-card overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
          <div
            ref={mapRef}
            className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
          >
            <div
              className="absolute inset-0 origin-center transition-transform duration-200 ease-out"
              style={{ transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})` }}
            >
              {/* Background image */}
              <img
                src={campusImage.url}
                alt="GNITS campus layout"
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Route overlay */}
              {route && routeLine && (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                  <polyline
                    points={routeLine}
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="2 1.2"
                    style={{ filter: 'drop-shadow(0 0 2px hsla(var(--accent),0.6))' }}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.2s" repeatCount="indefinite" />
                  </polyline>
                </svg>
              )}

              {/* Markers */}
              {filtered.map(loc => {
                const Icon = iconMap[loc.type];
                const isSelected = selectedId === loc.id;
                const isEndpoint = route && (loc.id === fromId || loc.id === toId);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); focusOn(loc); }}
                    onMouseDown={e => e.stopPropagation()}
                    title={loc.name}
                    className="absolute group"
                    style={{
                      left: `${loc.x}%`,
                      top: `${loc.y}%`,
                      transform: `translate(-50%, -50%) scale(${1 / Math.sqrt(zoom)})`,
                    }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full shadow-md ring-2 ring-white transition-all
                        ${typeColors[loc.type]}
                        ${isSelected ? 'w-8 h-8 ring-[hsl(var(--gold))] z-20' : 'w-6 h-6 hover:scale-110'}
                        ${isEndpoint ? 'ring-[hsl(var(--gold))] z-20' : ''}`}
                    >
                      <Icon className={isSelected ? 'w-4 h-4' : 'w-3 h-3'} />
                    </span>
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap
                        bg-background/90 backdrop-blur border border-border shadow-sm
                        ${isSelected || isEndpoint ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    >
                      {loc.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 bg-background/95 backdrop-blur border rounded-lg shadow p-1 z-30">
            <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-8 h-8 grid place-items-center rounded hover:bg-muted" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="w-8 h-8 grid place-items-center rounded hover:bg-muted" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={resetView} className="w-8 h-8 grid place-items-center rounded hover:bg-muted" title="Reset view"><Maximize2 className="w-4 h-4" /></button>
          </div>

          {/* Compass */}
          <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur border rounded-full w-12 h-12 grid place-items-center text-[10px] font-bold text-foreground shadow z-30">
            <div className="relative w-full h-full">
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2">N</span>
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2">S</span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2">W</span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2">E</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="flex border-b">
              <button
                onClick={() => setTab('details')}
                className={`flex-1 py-2.5 text-sm font-medium ${tab === 'details' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <MapPin className="w-4 h-4 inline mr-1.5" /> Details
              </button>
              <button
                onClick={() => setTab('route')}
                className={`flex-1 py-2.5 text-sm font-medium ${tab === 'route' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <Navigation className="w-4 h-4 inline mr-1.5" /> Route
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'details' ? (
                <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                  {selected ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className={`w-10 h-10 rounded-lg grid place-items-center ${typeColors[selected.type]}`}>
                          {(() => { const Icon = iconMap[selected.type]; return <Icon className="w-5 h-5" />; })()}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-display text-lg leading-tight text-foreground">{selected.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize mt-0.5">{selected.type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setFromId(selected.id); setTab('route'); }}
                          className="text-xs py-2 rounded-md border hover:bg-muted font-medium"
                        >
                          Set as Start
                        </button>
                        <button
                          onClick={() => { setToId(selected.id); setTab('route'); }}
                          className="text-xs py-2 rounded-md bg-[hsl(var(--navy))] text-primary-foreground hover:opacity-90 font-medium"
                        >
                          Set as Destination
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1.5">Nearby</p>
                        <div className="flex flex-wrap gap-1.5">
                          {campusLocations
                            .filter(l => l.id !== selected.id)
                            .map(l => ({ l, d: Math.hypot(l.x - selected.x, l.y - selected.y) }))
                            .sort((a, b) => a.d - b.d).slice(0, 4)
                            .map(({ l }) => (
                              <button key={l.id} onClick={() => focusOn(l)} className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 text-foreground">
                                {l.name}
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click any location on the map to see details.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground">From</label>
                    <select
                      value={fromId}
                      onChange={e => setFromId(e.target.value)}
                      className="w-full mt-1 h-9 px-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select start…</option>
                      {campusLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">To</label>
                    <select
                      value={toId}
                      onChange={e => setToId(e.target.value)}
                      className="w-full mt-1 h-9 px-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Select destination…</option>
                      {campusLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!fromId || !toId}
                      onClick={onShowRoute}
                      className="flex-1 h-9 rounded-md bg-[hsl(var(--gold))] text-accent-foreground text-sm font-semibold disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-1.5"
                    >
                      <RouteIcon className="w-4 h-4" /> Show Route
                    </button>
                    {route && (
                      <button onClick={() => setRoute(null)} className="h-9 px-2 rounded-md border hover:bg-muted" title="Clear">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {route && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Distance</p>
                          <p className="text-base font-semibold text-foreground">{route.distanceMeters} m</p>
                        </div>
                        <div className="rounded-lg bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Walk</p>
                          <p className="text-base font-semibold text-foreground">{route.walkingMinutes} min</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1.5">Directions</p>
                        <ol className="space-y-1.5">
                          {route.steps.map((s, i) => (
                            <li key={i} className="flex gap-2 text-xs text-foreground">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--navy))] text-primary-foreground grid place-items-center text-[10px] font-bold">{i + 1}</span>
                              <span className="pt-0.5">{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location list */}
          <div className="rounded-2xl border bg-card">
            <div className="p-3 border-b flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">All Locations</p>
              <span className="text-[11px] text-muted-foreground">{filtered.length}</span>
            </div>
            <div className="max-h-[340px] overflow-auto p-2 space-y-1">
              {filtered.map(l => {
                const Icon = iconMap[l.type];
                return (
                  <button
                    key={l.id}
                    onClick={() => focusOn(l)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-md text-left hover:bg-muted text-sm transition-colors ${selectedId === l.id ? 'bg-muted ring-1 ring-[hsl(var(--gold))]' : ''}`}
                  >
                    <span className={`w-7 h-7 rounded-md grid place-items-center flex-shrink-0 ${typeColors[l.type]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-foreground truncate">{l.name}</span>
                      <span className="block text-[10px] text-muted-foreground capitalize">{l.type}</span>
                    </span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No locations match "{search}"</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
