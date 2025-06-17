// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// export interface User {
//   id: string;
//   email: string;
//   name?: string;
//   image?: string;
// }

// export interface Session {
//   user: User;
//   expiresAt: string;
// }

// interface AuthState {
//   session: Session | null;
//   isLoading: boolean;
//   setSession: (session: Session | null) => void;
//   setLoading: (loading: boolean) => void;
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       session: null,
//       isLoading: false,
//       setSession: (session) => set({ session }),
//       setLoading: (isLoading) => set({ isLoading }),
//       logout: () => set({ session: null }),
//     }),
//     {
//       name: 'auth-storage',
//       partialize: (state) => ({ session: state.session }),
//     }
//   )
// );
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

export interface SessionData {
  id: string;
  token: string;
  userId: string;
  // Add other session properties as needed
  userAgent?: string | null;
}

export interface Session {
  user: User;
  session: SessionData;
}

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isLoading: false,
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ session: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ session: state.session }),
    }
  )
);