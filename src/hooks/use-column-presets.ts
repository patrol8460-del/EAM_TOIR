'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface PresetItem {
  id: string
  userId: string
  module: string
  name: string
  type: string
  columns: string // JSON
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export function useColumnPresets(module: string, userId: string) {
  const [presets, setPresets] = useState<PresetItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPresets = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/column-presets?module=${module}`)
      if (res.ok) {
        const data = await res.json()
        setPresets((data.presets || []).filter((p: PresetItem) => p.userId === userId))
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [module, userId])

  useEffect(() => { fetchPresets() }, [fetchPresets])

  const savePreset = useCallback(async (
    name: string,
    type: 'view' | 'export',
    columns: string[],
    isDefault = false,
  ) => {
    try {
      const res = await fetch('/api/column-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, module, name, type, columns, isDefault }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }
      toast.success(`Пресет «${name}» сохранён`)
      await fetchPresets()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения пресета')
      return false
    }
  }, [userId, module, fetchPresets])

  const deletePreset = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/column-presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      toast.success('Пресет удалён')
      await fetchPresets()
      return true
    } catch {
      toast.error('Ошибка удаления')
      return false
    }
  }, [fetchPresets])

  const setAsDefault = useCallback(async (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    const cols = JSON.parse(preset.columns)
    return savePreset(preset.name, preset.type as 'view' | 'export', cols, true)
  }, [presets, savePreset])

  return { presets, loading, savePreset, deletePreset, setAsDefault, refetch: fetchPresets }
}
