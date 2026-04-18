'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  skills?: any[];
  preferences?: any;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: User | null; // For compatibility, aliases user
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshUser: async () => { },
  signOut: async () => { },
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        // Ensure id is present (Mongoose uses _id)
        const finalId = data.user.id || data.user._id;
        const userData = { ...data.user, id: finalId };
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: { message: data.error || 'Login failed' } };
      }
      const finalId = data.user.id || data.user._id;
      setUser({ ...data.user, id: finalId });
      router.push('/dashboard');
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: { message: data.error || 'Signup failed' } };
      }
      const finalId = data.user.id || data.user._id;
      setUser({ ...data.user, id: finalId });
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error' } };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: { message: data.error || 'Update failed' } };
      }
      const finalId = data.user.id || data.user._id;
      setUser({ ...data.user, id: finalId });
      return { error: null };
    } catch (error) {
      return { error: { message: 'Network error' } };
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile: user, loading, refreshUser, signOut, signIn, signUp, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
