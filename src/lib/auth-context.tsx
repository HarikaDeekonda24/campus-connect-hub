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

async function fetchUserProfile(userId: string): Promise<{ user: User | null; error?: string }> {
  console.log('[fetchUserProfile] querying profiles for user_id:', userId);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('[fetchUserProfile] profiles result:', { profile, profileError });

  if (profileError) {
    return { user: null, error: `Profiles query error: ${profileError.message} (code: ${profileError.code})` };
  }

  if (!profile) {
    return { user: null, error: `No profile row found for user_id = ${userId}` };
  }

  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('[fetchUserProfile] user_roles result:', { roleData, roleError });

  return {
    user: {
      id: userId,
      name: profile.name,
      email: profile.email,
      role: (roleData?.role as UserRole) || 'student',
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then(({ user }) => {
          setUser(user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }
      if (session?.user) {
        (async () => {
          const { user } = await fetchUserProfile(session.user.id);
          setUser(user);
          setLoading(false);
        })();
      }
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
      console.log('[login] Authenticated user.id:', data.user.id, 'email:', data.user.email);
      const { user: profile, error: profileError } = await fetchUserProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        const msg = profileError || 'Profile not found. Please contact admin.';
        console.error('[login] Profile fetch failed:', msg);
        return { success: false, error: msg };
      }
      if (!profile.approved) {
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
