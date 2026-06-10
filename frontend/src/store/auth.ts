import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isAdmin: false,
  
  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ 
    profile, 
    isAdmin: profile?.role === 'admin' 
  }),
  
  logout: () => set({ 
    user: null, 
    profile: null, 
    isAdmin: false 
  }),
}));
