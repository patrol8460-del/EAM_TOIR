import { create } from 'zustand'

export type ModuleKey = 'dashboard' | 'equipment' | 'personnel' | 'spare-parts' | 'planning' | 'requests' | 'analytics'

interface AppState {
  activeModule: ModuleKey
  sidebarCollapsed: boolean
  setActiveModule: (module: ModuleKey) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  setActiveModule: (activeModule) => set({ activeModule }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
}))
