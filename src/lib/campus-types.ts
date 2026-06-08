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
  approved: boolean;
}
