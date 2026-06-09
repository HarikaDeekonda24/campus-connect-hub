import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole, Branch, User } from '@/lib/campus-types';

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

async function loadUserByAuthId(authUserId: string): Promise<User | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUserId)
    .maybeSingle();
  if (!profile) return null;
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', authUserId)
    .maybeSingle();
  return {
    id: profile.user_id,
    name: profile.name,
    email: profile.email,
    role: (roleRow?.role as UserRole) || 'student',
    department: profile.department || 'General',
    branches: (profile.branches || []) as Branch[],
    rollNumber: profile.roll_number || undefined,
    is_approved: profile.approved,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await loadUserByAuthId(session.user.id));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(async () => {
          setUser(await loadUserByAuthId(session.user.id));
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const { data: roles } = await supabase.from('user_roles').select('*');
    if (!profiles) return;
    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));
    const users: User[] = profiles.map(p => ({
      id: p.user_id,
      name: p.name,
      email: p.email,
      role: (roleMap.get(p.user_id) as UserRole) || 'student',
      department: p.department || 'General',
      branches: (p.branches || []) as Branch[],
      rollNumber: p.roll_number || undefined,
      is_approved: p.approved,
    }));
    setRegisteredUsers(users.filter(u => u.is_approved));
    setPendingFaculty(users.filter(u => !u.is_approved && u.role === 'faculty'));
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') refreshUsers();
  }, [user?.role, refreshUsers]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      if (!data.email.endsWith('@gnits.ac.in')) {
        return { success: false, error: 'Please use a valid college email (@gnits.ac.in)' };
      }

      const department = data.branches[0] || 'General';
      const redirectUrl = `${window.location.origin}/`;

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: `${data.firstName} ${data.lastName}`.trim(),
            role: data.role,
            department,
            branches: data.branches,
            roll_number: data.role === 'student' ? data.rollNumber || null : null,
            phone: data.phone || null,
            section: data.role === 'student' ? data.section || null : null,
          },
        },
      });

      if (signUpError) return { success: false, error: signUpError.message };
      if (!authData.user) return { success: false, error: 'Signup failed — no user returned' };

      return { success: true, pendingApproval: data.role === 'faculty' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: 'Invalid credentials. Please check your email and password.' };
      if (!data.user) return { success: false, error: 'Login failed' };

      const profile = await loadUserByAuthId(data.user.id);
      if (!profile) return { success: false, error: 'Account profile not found. Please contact admin.' };

      setUser(profile);
      if (!profile.is_approved && profile.role === 'faculty') {
        return { success: true, role: profile.role, pendingApproval: true };
      }
      return { success: true, role: profile.role };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
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
    await supabase.from('profiles').delete().eq('user_id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const createHOD = useCallback(async (_data: CreateHODData) => {
    return { success: false, error: 'HOD invites are not yet configured.' };
  }, []);

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
