import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: (user) => set({ user, isLoading: false }),
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    set({ user: null, isLoading: false })
    // Clear localStorage fallback session
    try {
      localStorage.removeItem('session_token')
      localStorage.removeItem('session_user')
    } catch { /* localStorage may not be available */ }
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Even if the API call fails, we still redirect to login
    }
    window.location.replace('/')
  },
}))
