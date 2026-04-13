'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  profile_image_url: string | null;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: 'worker' | 'recruiter' | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.email) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, name, role, profile_image_url')
          .eq('email', authUser.email)
          .maybeSingle();
        
        if (userData) {
          setUser(userData as UserProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching user:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const role = user?.role === 'recruiter' ? 'recruiter' : user?.role === 'worker' ? 'worker' : null;

  return (
    <AuthContext.Provider value={{ user, loading, role, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}