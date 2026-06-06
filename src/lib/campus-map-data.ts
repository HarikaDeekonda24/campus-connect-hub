// Campus map data — derived from GNITS official campus layout image.
// Coordinates are normalized percentages (0-100) relative to the layout image.
// Origin (0,0) = top-left of the image.

export type LocationType =
  | 'academic'
  | 'lab'
  | 'library'
  | 'hostel'
  | 'admin'
  | 'sports'
  | 'facility'
  | 'parking'
  | 'landmark'
  | 'gate';

export interface CampusLocation {
  id: string;
  name: string;
  type: LocationType;
  x: number; // % from left
  y: number; // % from top
  description?: string;
  aliases?: string[];
}

// Real locations visible in the uploaded campus layout image.
export const campusLocations: CampusLocation[] = [
  // Top academic row
  { id: 'xerox', name: 'Xerox', type: 'facility', x: 38, y: 13.5 },
  { id: 'staff-room', name: 'Staff Room', type: 'admin', x: 49, y: 13.5 },
  { id: 'labs', name: 'Labs', type: 'lab', x: 58, y: 13.5 },
  { id: 'shuttle-badminton', name: 'Shuttle Badminton', type: 'sports', x: 70, y: 13.5 },
  { id: 'eee-block', name: 'E.E.E. Block', type: 'academic', x: 38, y: 18.5, aliases: ['eee', 'electrical'] },
  { id: 'cse-block', name: 'C.S.E. Block', type: 'academic', x: 50, y: 18.5, aliases: ['cse', 'computer science'] },
  { id: 'ece-block', name: 'E.C.E. Block', type: 'academic', x: 68, y: 18.5, aliases: ['ece', 'electronics'] },

  // Top right
  { id: 'hostel-block-1', name: 'Hostel Block-I', type: 'hostel', x: 82, y: 8 },
  { id: 'rock-garden', name: 'Rock Garden', type: 'landmark', x: 93, y: 6 },

  // Mid row
  { id: 'library', name: 'Library (I.T. & E.T.E. Block)', type: 'library', x: 37, y: 33, aliases: ['it block', 'ete block', 'library'] },
  { id: 'auditorium', name: 'Auditorium', type: 'facility', x: 56, y: 31 },
  { id: 'hostel-block-2', name: 'Hostel Block-II', type: 'hostel', x: 82, y: 32 },
  { id: 'silver-jubilee', name: 'Silver Jubilee Block', type: 'academic', x: 70, y: 42, aliases: ['sjb'] },

  // Lower-mid
  { id: 'canteen-incubation', name: 'Canteen / Incubation & Innovation Building', type: 'facility', x: 25, y: 45, aliases: ['canteen', 'incubation'] },
  { id: 'basket-ball-court', name: 'Basket Ball Court', type: 'sports', x: 37, y: 47 },
  { id: 'play-area', name: 'Play Area', type: 'sports', x: 55, y: 50 },
  { id: 'sports-room', name: 'Sports Room', type: 'sports', x: 63, y: 60 },
  { id: 'civil-dept', name: 'Civil Department', type: 'academic', x: 63, y: 67, aliases: ['civil'] },

  // Bottom left
  { id: 'admin-building', name: 'Admin Building', type: 'admin', x: 18, y: 62, aliases: ['administration', 'office'] },
  { id: 'gpr-memorial', name: 'G.P.R. Memorial', type: 'landmark', x: 30, y: 60, aliases: ['gpr'] },
  { id: 'parking-left', name: 'Parking (Left)', type: 'parking', x: 13, y: 50 },
  { id: 'visitors-parking', name: 'Visitors Parking', type: 'parking', x: 5, y: 55 },

  // Bottom right
  { id: 'parking-right', name: 'Parking (Right)', type: 'parking', x: 78, y: 78 },
  { id: 'parking-east', name: 'Parking (East)', type: 'parking', x: 87, y: 58 },
  { id: 'washing-machine', name: 'Washing Area', type: 'facility', x: 92, y: 70 },
  { id: 'hostel-quarters', name: 'Hostel Quarters', type: 'hostel', x: 93, y: 82 },

  // Gate
  { id: 'gate', name: 'Main Gate', type: 'gate', x: 5, y: 92 },
];

// Navigation graph: walkable nodes following the internal roads of the campus.
// Junction nodes (j-*) approximate where the campus roads intersect.
export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export const graphNodes: GraphNode[] = [
  ...campusLocations.map(l => ({ id: l.id, x: l.x, y: l.y })),
  // Road junctions reading off the campus image
  { id: 'j-north-w', x: 38, y: 23 },
  { id: 'j-north-c', x: 50, y: 23 },
  { id: 'j-north-e', x: 70, y: 23 },
  { id: 'j-mid-w', x: 37, y: 40 },     // outside library
  { id: 'j-mid-c', x: 50, y: 40 },     // central road
  { id: 'j-mid-e', x: 70, y: 40 },     // outside silver jubilee
  { id: 'j-vert-w', x: 25, y: 55 },    // left vertical road
  { id: 'j-vert-c1', x: 42, y: 55 },   // road by basket ball court
  { id: 'j-vert-c2', x: 50, y: 55 },
  { id: 'j-vert-e', x: 78, y: 55 },    // right vertical road
  { id: 'j-south-w', x: 18, y: 88 },
  { id: 'j-south-c1', x: 30, y: 88 },
  { id: 'j-south-c2', x: 50, y: 88 },
  { id: 'j-south-c3', x: 65, y: 88 },
  { id: 'j-south-e', x: 78, y: 88 },
  { id: 'j-gate', x: 5, y: 88 },
];

// Edges represent walkable road segments between nodes.
export const graphEdges: Array<[string, string]> = [
  // Top academic strip
  ['xerox', 'staff-room'],
  ['staff-room', 'labs'],
  ['labs', 'shuttle-badminton'],
  ['xerox', 'eee-block'],
  ['staff-room', 'cse-block'],
  ['labs', 'cse-block'],
  ['shuttle-badminton', 'ece-block'],
  ['eee-block', 'cse-block'],
  ['cse-block', 'ece-block'],

  // From academic blocks to north road
  ['eee-block', 'j-north-w'],
  ['cse-block', 'j-north-c'],
  ['ece-block', 'j-north-e'],
  ['j-north-w', 'j-north-c'],
  ['j-north-c', 'j-north-e'],

  // North → mid road verticals
  ['j-north-w', 'library'],
  ['library', 'j-mid-w'],
  ['j-north-c', 'auditorium'],
  ['auditorium', 'j-mid-c'],
  ['j-north-e', 'silver-jubilee'],
  ['silver-jubilee', 'j-mid-e'],
  ['j-mid-w', 'j-mid-c'],
  ['j-mid-c', 'j-mid-e'],

  // Hostel connections
  ['j-north-e', 'hostel-block-1'],
  ['hostel-block-1', 'rock-garden'],
  ['j-mid-e', 'hostel-block-2'],

  // Mid → lower verticals
  ['j-mid-w', 'basket-ball-court'],
  ['basket-ball-court', 'j-vert-c1'],
  ['j-mid-c', 'play-area'],
  ['play-area', 'j-vert-c2'],
  ['j-mid-e', 'j-vert-e'],
  ['canteen-incubation', 'j-mid-w'],
  ['canteen-incubation', 'j-vert-w'],

  // Lower mid horizontal
  ['j-vert-w', 'j-vert-c1'],
  ['j-vert-c1', 'j-vert-c2'],
  ['j-vert-c2', 'j-vert-e'],

  // Side branches
  ['sports-room', 'j-vert-c2'],
  ['sports-room', 'civil-dept'],
  ['gpr-memorial', 'j-vert-c1'],
  ['admin-building', 'j-vert-w'],
  ['parking-left', 'j-vert-w'],
  ['visitors-parking', 'parking-left'],
  ['parking-east', 'j-vert-e'],
  ['parking-east', 'washing-machine'],

  // South perimeter road
  ['j-south-w', 'admin-building'],
  ['j-south-c1', 'gpr-memorial'],
  ['j-south-c2', 'j-vert-c2'],
  ['j-south-c3', 'civil-dept'],
  ['j-south-e', 'parking-right'],
  ['parking-right', 'hostel-quarters'],
  ['parking-right', 'washing-machine'],
  ['j-gate', 'gate'],
  ['j-gate', 'j-south-w'],
  ['j-south-w', 'j-south-c1'],
  ['j-south-c1', 'j-south-c2'],
  ['j-south-c2', 'j-south-c3'],
  ['j-south-c3', 'j-south-e'],
];
