export type UserRole = 'student' | 'faculty' | 'hod' | 'admin';

export type Branch = 'CSE' | 'CSM' | 'CSD' | 'ECE' | 'IT' | 'EVM' | 'EEE';

export const ALL_BRANCHES: Branch[] = ['CSE', 'CSM', 'CSD', 'ECE', 'IT', 'EVM', 'EEE'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  rollNumber?: string;
  branches: Branch[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  category: 'hackathon' | 'workshop' | 'seminar' | 'club-event';
  status: 'pending' | 'approved' | 'rejected';
  poster: string;
  registrationLink?: string;
  featured?: boolean;
  branch?: Branch;
}

export interface AttendanceRequest {
  id: string;
  studentName: string;
  rollNumber: string;
  branch: Branch;
  department: string;
  eventName: string;
  eventDate: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Concern {
  id: string;
  category: 'academic' | 'infrastructure' | 'faculty-issue' | 'general';
  message: string;
  date: string;
  status: 'new' | 'reviewed';
  recipient: 'hod' | 'admin';
  branch?: Branch;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'event' | 'approval' | 'attendance' | 'announcement';
}

export const mockUsers: User[] = [
  { id: '1', name: 'Arun Kumar', email: 'arun@campus.edu', role: 'student', department: 'Computer Science', rollNumber: 'CS2024001', branches: ['CSE'] },
  { id: '2', name: 'Dr. Priya Sharma', email: 'priya@campus.edu', role: 'faculty', department: 'Computer Science', branches: ['CSE', 'CSM'] },
  { id: '3', name: 'Admin User', email: 'admin@campus.edu', role: 'admin', department: 'Administration', branches: [...ALL_BRANCHES] },
  { id: '4', name: 'Dr. Rajesh Verma', email: 'hod@campus.edu', role: 'hod', department: 'Computer Science', branches: ['CSE', 'CSD'] },
  { id: '5', name: 'Meera Patel', email: 'meera@campus.edu', role: 'student', department: 'Electronics', rollNumber: 'EC2024015', branches: ['ECE'] },
  { id: '6', name: 'Dr. Sunita Rao', email: 'sunita@campus.edu', role: 'faculty', department: 'Information Technology', branches: ['IT', 'CSE'] },
];

export const mockEvents: Event[] = [
  {
    id: '1', title: 'HackCampus 2026', description: 'Annual 48-hour hackathon with prizes worth ₹5L. Build innovative solutions for real-world problems.', date: '2026-04-15', time: '09:00 AM', venue: 'Main Auditorium', organizer: 'Tech Club', category: 'hackathon', status: 'approved', poster: '', featured: true, branch: 'CSE',
  },
  {
    id: '2', title: 'AI/ML Workshop', description: 'Hands-on workshop on building machine learning models with TensorFlow and PyTorch.', date: '2026-04-10', time: '02:00 PM', venue: 'Lab Block C', organizer: 'AI Society', category: 'workshop', status: 'approved', poster: '', featured: true, branch: 'CSM',
  },
  {
    id: '3', title: 'Research Symposium', description: 'Presentations of cutting-edge research from faculty and graduate students.', date: '2026-04-20', time: '10:00 AM', venue: 'Seminar Hall B', organizer: 'Research Dept', category: 'seminar', status: 'approved', poster: '', branch: 'ECE',
  },
  {
    id: '4', title: 'Cultural Night', description: 'Annual cultural fest featuring music, dance, and theater performances.', date: '2026-04-25', time: '06:00 PM', venue: 'Open Air Theater', organizer: 'Cultural Committee', category: 'club-event', status: 'approved', poster: '', featured: true,
  },
  {
    id: '5', title: 'Web Dev Bootcamp', description: 'A 3-day intensive bootcamp on full-stack web development.', date: '2026-05-01', time: '09:00 AM', venue: 'Computer Lab A', organizer: 'Dev Club', category: 'workshop', status: 'pending', poster: '', branch: 'CSE',
  },
  {
    id: '6', title: 'Startup Pitch Night', description: 'Present your startup ideas to real investors and mentors.', date: '2026-05-05', time: '05:00 PM', venue: 'Innovation Hub', organizer: 'E-Cell', category: 'seminar', status: 'pending', poster: '', branch: 'IT',
  },
];

export const mockAttendanceRequests: AttendanceRequest[] = [
  { id: '1', studentName: 'Arun Kumar', rollNumber: 'CS2024001', branch: 'CSE', department: 'Computer Science', eventName: 'HackCampus 2026', eventDate: '2026-04-15', proof: 'Registration confirmed via email', status: 'pending' },
  { id: '2', studentName: 'Meera Patel', rollNumber: 'EC2024015', branch: 'ECE', department: 'Electronics', eventName: 'AI/ML Workshop', eventDate: '2026-04-10', proof: 'Payment receipt attached', status: 'approved' },
  { id: '3', studentName: 'Ravi Singh', rollNumber: 'CS2024008', branch: 'CSE', department: 'Computer Science', eventName: 'Web Dev Bootcamp', eventDate: '2026-05-01', proof: 'Email confirmation', status: 'pending' },
];

export const mockConcerns: Concern[] = [
  { id: '1', category: 'infrastructure', message: 'The Wi-Fi in Block C has been very slow for the past week. Many students are unable to attend online labs.', date: '2026-03-24', status: 'new', recipient: 'hod', branch: 'CSE' },
  { id: '2', category: 'academic', message: 'The exam schedule overlaps with the hackathon. Can we get an alternative date for the mid-semester exam?', date: '2026-03-23', status: 'reviewed', recipient: 'admin' },
  { id: '3', category: 'general', message: 'The library closes too early. It would be great if it could stay open until 10 PM during exam season.', date: '2026-03-22', status: 'new', recipient: 'admin' },
  { id: '4', category: 'faculty-issue', message: 'Some faculty members are not following the updated syllabus for this semester.', date: '2026-03-21', status: 'new', recipient: 'hod', branch: 'CSE' },
];

export const mockNotifications: Notification[] = [
  { id: '1', title: 'New Event', message: 'HackCampus 2026 registration is now open!', date: '2026-03-25', read: false, type: 'event' },
  { id: '2', title: 'Attendance Approved', message: 'Your attendance request for AI/ML Workshop has been approved.', date: '2026-03-24', read: false, type: 'attendance' },
  { id: '3', title: 'Event Approved', message: 'Your submitted event "Web Dev Bootcamp" is under review.', date: '2026-03-23', read: true, type: 'approval' },
];

export const campusBuildings = [
  { id: 'block-a', name: 'Block A', type: 'academic', departments: ['Computer Science', 'Information Technology'], floors: 4, rooms: ['A101', 'A102', 'A201', 'A202', 'A301', 'A302'] },
  { id: 'block-b', name: 'Block B', type: 'academic', departments: ['Electronics', 'Electrical'], floors: 3, rooms: ['B101', 'B102', 'B201', 'B202'] },
  { id: 'block-c', name: 'Block C', type: 'lab', departments: ['Computer Lab', 'Hardware Lab', 'IoT Lab'], floors: 2, rooms: ['C101', 'C102', 'C201'] },
  { id: 'library', name: 'Central Library', type: 'facility', departments: ['Reading Hall', 'Digital Library', 'Archives'], floors: 3, rooms: ['L1', 'L2', 'L3'] },
  { id: 'auditorium', name: 'Main Auditorium', type: 'facility', departments: ['Main Hall', 'Mini Hall'], floors: 1, rooms: ['AUD-1', 'AUD-2'] },
  { id: 'admin-block', name: 'Admin Block', type: 'admin', departments: ['Registrar', 'Finance', 'HR'], floors: 2, rooms: ['AD101', 'AD102', 'AD201'] },
  { id: 'sports', name: 'Sports Complex', type: 'facility', departments: ['Indoor Games', 'Outdoor Fields', 'Gym'], floors: 1, rooms: ['SP1', 'SP2'] },
  { id: 'cafeteria', name: 'Central Cafeteria', type: 'facility', departments: ['Food Court', 'Juice Bar'], floors: 1, rooms: ['CF1'] },
];
