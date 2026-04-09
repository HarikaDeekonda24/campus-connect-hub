import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

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
  password: string;
}

interface CreateHODData {
  name: string;
  email: string;
  branches: Branch[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; pendingApproval?: boolean; error?: string }>;
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

async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!profile) return null;

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return {
    id: userId,
    name: profile.name,
    email: profile.email,
    role: (roleData?.role as UserRole) || 'student',
    department: profile.department || 'General',
    branches: (profile.branches as Branch[]) || [],
    rollNumber: profile.roll_number || undefined,
    approved: profile.approved,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  const refreshUsers = useCallback(async () => {
    // Only admins need this data
    if (!user || user.role !== 'admin') return;

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (!profiles || !roles) return;

    const roleMap = new Map(roles.map(r => [r.user_id, r.role as UserRole]));

    const allUsers: User[] = profiles.map(p => ({
      id: p.user_id,
      name: p.name,
      email: p.email,
      role: roleMap.get(p.user_id) || 'student',
      department: p.department || 'General',
      branches: (p.branches as Branch[]) || [],
      rollNumber: p.roll_number || undefined,
      approved: p.approved,
    }));

    setRegisteredUsers(allUsers.filter(u => u.approved));
    setPendingFaculty(allUsers.filter(u => !u.approved && u.role === 'faculty'));
  }, [user]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh users list when user changes (admin)
  useEffect(() => {
    if (user?.role === 'admin') {
      refreshUsers();
    }
  }, [user?.role, refreshUsers]);

  const register = useCallback(async (data: RegisterData) => {
    if (!data.email.endsWith('@gnits.ac.in')) {
      return { success: false, error: 'Please use a valid college email (@gnits.ac.in)' };
    }

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: `${data.firstName} ${data.lastName}`,
          role: data.role,
          department: data.branches[0] || 'General',
          branches: data.branches,
          roll_number: data.role === 'student' ? data.rollNumber : undefined,
        },
      },
    });

    if (error) return { success: false, error: error.message };

    // Sign out after registration so they can login fresh
    await supabase.auth.signOut();

    if (data.role === 'faculty') {
      return { success: true, pendingApproval: true };
    }
    return { success: true };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { success: false, error: error.message };

    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      if (profile && !profile.approved) {
        await supabase.auth.signOut();
        return { success: false, pendingApproval: true };
      }
      setUser(profile);
      return { success: true };
    }

    return { success: false, error: 'Login failed' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const approveFaculty = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ approved: true }).eq('user_id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const rejectFaculty = useCallback(async (userId: string) => {
    // Delete the user's profile and role, then remove from auth
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const createHOD = useCallback(async (data: CreateHODData) => {
    if (!data.email.endsWith('@gnits.ac.in')) {
      return { success: false, error: 'Must use @gnits.ac.in email' };
    }

    // Sign up the HOD with a default password
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: 'gnits@hod2026',
      options: {
        data: {
          name: data.name,
          role: 'hod',
          department: data.branches[0] || 'General',
          branches: data.branches,
        },
      },
    });

    if (error) return { success: false, error: error.message };
    
    await refreshUsers();
    return { success: true };
  }, [refreshUsers]);

  return (
    <AuthContext.Provider value={{
      user, login, logout, register, isAuthenticated: !!user && user.approved,
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
