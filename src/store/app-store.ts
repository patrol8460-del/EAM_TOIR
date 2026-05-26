import { create } from 'zustand'

export type ModuleKey = 'dashboard' | 'equipment' | 'personnel' | 'spare-parts' | 'planning' | 'requests' | 'analytics'

export interface PendingTaskAction {
  requestId: string
  mode: 'detail' | 'edit'
}

interface AppState {
  activeModule: ModuleKey
  sidebarCollapsed: boolean
  pendingTask: PendingTaskAction | null
  setActiveModule: (module: ModuleKey) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setPendingTask: (task: PendingTaskAction | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarCollapsed: false,
  pendingTask: null,
  setActiveModule: (activeModule) => set({ activeModule }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setPendingTask: (pendingTask) => set({ pendingTask }),
}))
