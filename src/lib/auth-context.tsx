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

async function profileToUser(profile: any): Promise<User> {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as UserRole,
    department: profile.department || 'General',
    branches: (profile.branches || []) as Branch[],
    rollNumber: profile.roll_number || undefined,
    is_approved: profile.is_approved,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [pendingFaculty, setPendingFaculty] = useState<User[]>([]);

  const loadProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return profileToUser(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!data) return;
    const users = await Promise.all(data.map(profileToUser));
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

      // Check if this email has a HOD invite
      const { data: invite } = await supabase
        .from('hod_invites')
        .select('*')
        .eq('email', data.email)
        .maybeSingle();

      const isHodInvite = !!invite;
      const role: UserRole = isHodInvite ? 'hod' : data.role;
      const branches: Branch[] = isHodInvite ? (invite.branches as Branch[]) : data.branches;
      const department = branches[0] || 'General';

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) return { success: false, error: signUpError.message };
      if (!authData.user) return { success: false, error: 'Signup failed — no user returned' };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        role,
        department,
        branches,
        roll_number: role === 'student' ? data.rollNumber || null : null,
        phone: data.phone || null,
        section: role === 'student' ? data.section || null : null,
        is_approved: true,
      });

      if (profileError) return { success: false, error: profileError.message };

      // Remove HOD invite if used
      if (isHodInvite) {
        await supabase.from('hod_invites').delete().eq('email', data.email);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: 'Invalid credentials. Please check your email and password.' };
      if (!data.user) return { success: false, error: 'Login failed' };

      const profile = await loadProfile(data.user.id);
      if (!profile) return { success: false, error: 'Account profile not found. Please contact admin.' };

      setUser(profile);
      return { success: true, role: profile.role };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const approveFaculty = useCallback(async (userId: string) => {
    await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const rejectFaculty = useCallback(async (userId: string) => {
    await supabase.from('profiles').delete().eq('id', userId);
    await refreshUsers();
  }, [refreshUsers]);

  const createHOD = useCallback(async (data: CreateHODData) => {
    try {
      if (!data.email.endsWith('@gnits.ac.in')) {
        return { success: false, error: 'Must use @gnits.ac.in email' };
      }
      // Upsert a HOD invite — when they register, they automatically get HOD role + branches
      const { error } = await supabase.from('hod_invites').upsert({
        email: data.email,
        branches: data.branches,
      }, { onConflict: 'email' });

      if (error) return { success: false, error: error.message };
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
