'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { LoginPage } from '@/components/auth/login-page'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/components/modules/dashboard-page'
import EquipmentPage from '@/components/modules/equipment-page'
import PersonnelPage from '@/components/modules/personnel-page'
import SparePartsPage from '@/components/modules/spare-parts-page'
import PlanningPage from '@/components/modules/planning-page'
import RequestsPage from '@/components/modules/requests-page'
import AnalyticsPage from '@/components/modules/analytics-page'
import type { ModuleKey } from '@/store/app-store'
import type { User } from '@/store/auth-store'

const moduleComponents: Record<ModuleKey, React.ComponentType> = {
  dashboard: DashboardPage,
  equipment: EquipmentPage,
  personnel: PersonnelPage,
  'spare-parts': SparePartsPage,
  planning: PlanningPage,
  requests: RequestsPage,
  analytics: AnalyticsPage,
}

interface AppShellProps {
  user: User | null
}

export function AppShell({ user: initialUser }: AppShellProps) {
  const { user, login, setUser, logout } = useAuthStore()
  const activeModule = useAppStore((s) => s.activeModule)

  const currentUser = user || initialUser

  useEffect(() => {
    if (initialUser && !user) {
      login(initialUser)
    }
    // Sync: if server says no session but client has user -> logout
    if (!initialUser && user) {
      logout()
    }
  }, [])

  // Server says no user, client also no user -> login page
  if (!currentUser) {
    return <LoginPage />
  }

  const ActiveComponent = moduleComponents[activeModule] || DashboardPage

  return (
    <AppLayout>
      <ActiveComponent />
    </AppLayout>
  )
}
