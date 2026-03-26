import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole, mockUsers } from './mock-data';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, _password: string) => {
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      return true;
    }
    // Default demo login by role
    if (email.includes('student')) { setUser(mockUsers[0]); return true; }
    if (email.includes('faculty')) { setUser(mockUsers[1]); return true; }
    if (email.includes('hod')) { setUser(mockUsers[3]); return true; }
    if (email.includes('admin')) { setUser(mockUsers[2]); return true; }
    // Default to student
    setUser(mockUsers[0]);
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
