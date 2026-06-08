import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

async function fetchUserProfile(userId: string, email?: string): Promise<{ user: User | null; error?: string }> {
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    return { user: null, error: `Profile error: ${profileError.message}` };
  }
  if (!profile) {
    return { user: null, error: 'No profile found. Please register first.' };
  }

  const { data: roleRow } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  const role: UserRole = (roleRow?.role as UserRole) || 'student';

  return {
    user: {
      id: userId,
      name: profile.name,
      email: profile.email || email || '',
      role,
      department: profile.department || 'General',
      branches: (profile.branches as Branch[]) || [],
      rollNumber: profile.roll_number || undefined,
      approved: profile.approved,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  const refreshUsers = useCallback(async () => {
    const { data: profiles } = await (supabase as any).from('profiles').select('*');
    const { data: roles } = await (supabase as any).from('user_roles').select('*');
    if (!profiles) return;

    const roleMap = new Map<string, UserRole>();
    (roles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

    const allUsers: User[] = profiles.map((p: any) => ({
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
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      setTimeout(async () => {
        const { user } = await fetchUserProfile(session.user.id, session.user.email);
        setUser(user);
        setLoading(false);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email).then(({ user }) => {
          setUser(user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      refreshUsers();
    }
  }, [user?.role, refreshUsers]);

  const register = useCallback(async (data: RegisterData) => {
    if (!data.email.endsWith('@gnits.ac.in')) {
      return { success: false, error: 'Please use a valid college email (@gnits.ac.in)' };
    }

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const department = data.branches[0] || 'General';

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: fullName,
          role: data.role,
          department,
          branches: data.branches,
          roll_number: data.role === 'student' ? data.rollNumber : null,
          phone: data.phone,
          section: data.role === 'student' ? data.section : null,
        },
      },
    });

    if (error) return { success: false, error: error.message };

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
      const { user: profile, error: profileError } = await fetchUserProfile(data.user.id, data.user.email);
      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: profileError || 'Profile not found' };
      }
      if (!profile.approved && profile.role !== 'student') {
        await supabase.auth.signOut();
        return { success: false, pendingApproval: true };
      }
      setUser(profile);
      return { success: true, role: profile.role };
    }
    return { success: false, error: 'Login failed' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const approveFaculty = useCallback(async (userId: string) => {
    await (supabase as any).from('profiles').update({ approved: true }).eq('user_id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const rejectFaculty = useCallback(async (userId: string) => {
    await (supabase as any).from('profiles').delete().eq('user_id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const createHOD = useCallback(async (data: CreateHODData) => {
    if (!data.email.endsWith('@gnits.ac.in')) {
      return { success: false, error: 'Must use @gnits.ac.in email' };
    }
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: 'gnits@hod2026',
      options: {
        emailRedirectTo: `${window.location.origin}/`,
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
