import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiFetch } from './api';

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

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'student' | 'faculty';
  branches: Branch[];
  rollNumber?: string;
  section?: string;
  password: string;
}

interface CreateHODData {
  name: string;
  email: string;
  branches: Branch[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; pendingApproval?: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; pendingApproval?: boolean; error?: string }>;
  isAuthenticated: boolean;
  loading: boolean;
  registeredUsers: User[];
  pendingFaculty: User[];
  approveFaculty: (userId: string) => Promise<void>;
  rejectFaculty: (userId: string) => Promise<void>;
  createHOD: (data: CreateHODData) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  useEffect(() => {
    apiFetch('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const { users } = await apiFetch('/users');
      setRegisteredUsers(users.filter((u: User) => u.approved));
      setPendingFaculty(users.filter((u: User) => !u.approved && u.role === 'faculty'));
    } catch {}
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') refreshUsers();
  }, [user?.role, refreshUsers]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const result = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, pendingApproval: result.pendingApproval };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(result.user);
      return { success: true, role: result.role };
    } catch (err: any) {
      if (err.data?.pendingApproval) {
        return { success: false, pendingApproval: true };
      }
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }, []);

  const approveFaculty = useCallback(async (userId: string) => {
    await apiFetch(`/users/${userId}/approve`, { method: 'POST' });
    await refreshUsers();
  }, [refreshUsers]);

  const rejectFaculty = useCallback(async (userId: string) => {
    await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    await refreshUsers();
  }, [refreshUsers]);

  const createHOD = useCallback(async (data: CreateHODData) => {
    try {
      await apiFetch('/users/hod', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await refreshUsers();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{
      user, login, logout, register, isAuthenticated: !!user,
      loading, registeredUsers, pendingFaculty, approveFaculty, rejectFaculty,
      createHOD, refreshUsers,
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
