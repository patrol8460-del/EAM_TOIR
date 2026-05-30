'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore, type ModuleKey } from '@/store/app-store'
import { AppLayout } from '@/components/layout/app-layout'
import DashboardPage from '@/components/modules/dashboard-page'
import EquipmentPage from '@/components/modules/equipment-page'
import PersonnelPage from '@/components/modules/personnel-page'
import SparePartsPage from '@/components/modules/spare-parts-page'
import PlanningPage from '@/components/modules/planning-page'
import RequestsPage from '@/components/modules/requests-page'
import AnalyticsPage from '@/components/modules/analytics-page'

const moduleComponents: Record<ModuleKey, React.ComponentType> = {
  dashboard: DashboardPage,
  equipment: EquipmentPage,
  personnel: PersonnelPage,
  'spare-parts': SparePartsPage,
  planning: PlanningPage,
  requests: RequestsPage,
  analytics: AnalyticsPage,
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

export function AppShell({ user, onLogout }: { user: User; onLogout?: () => void }) {
  const setUser = useAuthStore((s) => s.setUser)
  const activeModule = useAppStore((s) => s.activeModule)

  useEffect(() => {
    setUser(user)
  }, [user, setUser])

  const ActiveComponent = moduleComponents[activeModule] || DashboardPage

  return (
    <AppLayout>
      <ActiveComponent />
    </AppLayout>
  )
}
