import { graphNodes, graphEdges, campusLocations, type GraphNode } from './campus-map-data';

// Approximate meters per 1% of map width/height (campus is roughly ~400m across).
const METERS_PER_PERCENT = 4;
const WALKING_SPEED_M_PER_MIN = 80; // ~4.8 km/h

const nodeMap = new Map<string, GraphNode>(graphNodes.map(n => [n.id, n]));

function dist(a: GraphNode, b: GraphNode) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
for (const n of graphNodes) adjacency.set(n.id, []);
for (const [a, b] of graphEdges) {
  const na = nodeMap.get(a);
  const nb = nodeMap.get(b);
  if (!na || !nb) continue;
  const w = dist(na, nb);
  adjacency.get(a)!.push({ to: b, weight: w });
  adjacency.get(b)!.push({ to: a, weight: w });
}

export interface RouteResult {
  path: GraphNode[];
  distanceMeters: number;
  walkingMinutes: number;
  steps: string[];
}

export function findRoute(fromId: string, toId: string): RouteResult | null {
  if (!nodeMap.has(fromId) || !nodeMap.has(toId)) return null;
  if (fromId === toId) {
    const n = nodeMap.get(fromId)!;
    return { path: [n], distanceMeters: 0, walkingMinutes: 0, steps: ['You are already at your destination.'] };
  }

  // Dijkstra
  const dists = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  for (const n of graphNodes) {
    dists.set(n.id, Infinity);
    prev.set(n.id, null);
  }
  dists.set(fromId, 0);

  while (visited.size < graphNodes.length) {
    let current: string | null = null;
    let best = Infinity;
    for (const [id, d] of dists) {
      if (!visited.has(id) && d < best) {
        best = d;
        current = id;
      }
    }
    if (current === null || best === Infinity) break;
    if (current === toId) break;
    visited.add(current);
    for (const edge of adjacency.get(current) || []) {
      if (visited.has(edge.to)) continue;
      const alt = best + edge.weight;
      if (alt < (dists.get(edge.to) ?? Infinity)) {
        dists.set(edge.to, alt);
        prev.set(edge.to, current);
      }
    }
  }

  if ((dists.get(toId) ?? Infinity) === Infinity) return null;

  // Rebuild path
  const ids: string[] = [];
  let cur: string | null = toId;
  while (cur) {
    ids.unshift(cur);
    cur = prev.get(cur) ?? null;
  }
  const path = ids.map(id => nodeMap.get(id)!);
  const distancePercent = dists.get(toId)!;
  const distanceMeters = Math.round(distancePercent * METERS_PER_PERCENT);
  const walkingMinutes = Math.max(1, Math.round(distanceMeters / WALKING_SPEED_M_PER_MIN));

  // Turn-by-turn: only mention named campus locations along the path
  const namedAlongPath: string[] = [];
  for (const id of ids) {
    const loc = campusLocations.find(l => l.id === id);
    if (loc) namedAlongPath.push(loc.name);
  }
  const steps: string[] = [];
  if (namedAlongPath.length === 0) {
    steps.push('Follow the campus road to your destination.');
  } else {
    steps.push(`Start at ${namedAlongPath[0]}.`);
    for (let i = 1; i < namedAlongPath.length - 1; i++) {
      steps.push(`Continue past ${namedAlongPath[i]}.`);
    }
    if (namedAlongPath.length > 1) {
      steps.push(`Arrive at ${namedAlongPath[namedAlongPath.length - 1]}.`);
    }
  }

  return { path, distanceMeters, walkingMinutes, steps };
}
