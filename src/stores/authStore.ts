import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  checkAuth: () => Promise<void>;
  register: (name: string, email: string) => Promise<void>;
  recover: (email: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = await res.json();
        set({ user, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  register: async (name: string, email: string) => {
    set({ error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      
      const user = await res.json();
      set({ user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Registration failed' });
      throw err;
    }
  },

  recover: async (email: string) => {
    set({ error: null });
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Recovery failed');
      }
      
      const user = await res.json();
      set({ user });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Recovery failed' });
      throw err;
    }
  },

  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
  },
}));
