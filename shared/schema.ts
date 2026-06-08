export type UserRole = 'student' | 'faculty' | 'hod' | 'admin';
export type Branch = 'CSE' | 'CSM' | 'CSD' | 'ECE' | 'IT' | 'EVM' | 'EEE';
export const ALL_BRANCHES: Branch[] = ['CSE', 'CSM', 'CSD', 'ECE', 'IT', 'EVM', 'EEE'];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  branches: Branch[];
  rollNumber?: string;
  phone?: string;
  section?: string;
  approved: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  branch?: Branch | null;
  status: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRequest {
  id: string;
  studentId: string;
  eventId?: string | null;
  studentName: string;
  rollNumber: string;
  branch: Branch;
  department: string;
  proof: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
