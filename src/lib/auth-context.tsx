import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, Branch, mockUsers, ALL_BRANCHES } from './mock-data';

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'student' | 'faculty';
  branches: Branch[];
  rollNumber?: string;
  password: string;
}

interface CreateHODData {
  name: string;
  email: string;
  branches: Branch[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; pendingApproval?: boolean };
  logout: () => void;
  register: (data: RegisterData) => { success: boolean; pendingApproval?: boolean; error?: string };
  isAuthenticated: boolean;
  registeredUsers: User[];
  pendingFaculty: User[];
  approveFaculty: (userId: string) => void;
  rejectFaculty: (userId: string) => void;
  createHOD: (data: CreateHODData) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([...mockUsers]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  const register = useCallback((data: RegisterData): { success: boolean; pendingApproval?: boolean; error?: string } => {
    // Check if email already exists
    const exists = [...registeredUsers, ...pendingFaculty].find(u => u.email === data.email);
    if (exists) return { success: false, error: 'Email already registered' };

    // Validate college email
    if (!data.email.endsWith('@gnits.ac.in')) {
      return { success: false, error: 'Please use a valid college email (@gnits.ac.in)' };
    }

    const newUser: User = {
      id: String(Date.now()),
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: data.role,
      department: data.branches[0] || 'General',
      branches: data.branches,
      rollNumber: data.role === 'student' ? data.rollNumber : undefined,
    };

    if (data.role === 'faculty') {
      setPendingFaculty(prev => [...prev, newUser]);
      return { success: true, pendingApproval: true };
    }

    setRegisteredUsers(prev => [...prev, newUser]);
    return { success: true };
  }, [registeredUsers, pendingFaculty]);

  const login = useCallback((email: string, _password: string): { success: boolean; pendingApproval?: boolean } => {
    // Check if faculty is pending
    const pending = pendingFaculty.find(u => u.email === email);
    if (pending) return { success: false, pendingApproval: true };

    const found = registeredUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      return { success: true };
    }

    // Demo login by role keyword
    if (email.includes('student')) { setUser(registeredUsers.find(u => u.role === 'student') || registeredUsers[0]); return { success: true }; }
    if (email.includes('faculty')) { setUser(registeredUsers.find(u => u.role === 'faculty') || registeredUsers[1]); return { success: true }; }
    if (email.includes('hod')) { setUser(registeredUsers.find(u => u.role === 'hod') || registeredUsers[3]); return { success: true }; }
    if (email.includes('admin')) { setUser(registeredUsers.find(u => u.role === 'admin') || registeredUsers[2]); return { success: true }; }

    return { success: false };
  }, [registeredUsers, pendingFaculty]);

  const logout = useCallback(() => setUser(null), []);

  const approveFaculty = useCallback((userId: string) => {
    const faculty = pendingFaculty.find(u => u.id === userId);
    if (faculty) {
      setPendingFaculty(prev => prev.filter(u => u.id !== userId));
      setRegisteredUsers(prev => [...prev, faculty]);
    }
  }, [pendingFaculty]);

  const rejectFaculty = useCallback((userId: string) => {
    setPendingFaculty(prev => prev.filter(u => u.id !== userId));
  }, []);

  const createHOD = useCallback((data: CreateHODData): { success: boolean; error?: string } => {
    const exists = registeredUsers.find(u => u.email === data.email);
    if (exists) return { success: false, error: 'Email already registered' };
    if (!data.email.endsWith('@gnits.ac.in')) return { success: false, error: 'Must use @gnits.ac.in email' };

    const newHOD: User = {
      id: String(Date.now()),
      name: data.name,
      email: data.email,
      role: 'hod',
      department: data.branches[0] || 'General',
      branches: data.branches,
    };
    setRegisteredUsers(prev => [...prev, newHOD]);
    return { success: true };
  }, [registeredUsers]);

  return (
    <AuthContext.Provider value={{
      user, login, logout, register, isAuthenticated: !!user,
      registeredUsers, pendingFaculty, approveFaculty, rejectFaculty, createHOD
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
