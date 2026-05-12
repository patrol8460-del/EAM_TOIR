'use client'

import { useState, useCallback, useRef } from 'react'
import { Plus, X, ListPlus, ClipboardPaste } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface MultiValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldLabel: string
  fieldColor: string
  values: string[]
  onValuesChange: (values: string[]) => void
}

export function MultiValueDialog({
  open,
  onOpenChange,
  fieldLabel,
  fieldColor,
  values,
  onValuesChange,
}: MultiValueDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const inputRef = useRef<HTMLInputElement>(null)

  const addValue = useCallback(
    (val: string) => {
      const trimmed = val.trim()
      if (trimmed && !values.includes(trimmed)) {
        onValuesChange([...values, trimmed])
      }
    },
    [values, onValuesChange],
  )

  const removeValue = useCallback(
    (idx: number) => {
      onValuesChange(values.filter((_, i) => i !== idx))
    },
    [values, onValuesChange],
  )

  const handleAddSingle = useCallback(() => {
    if (inputValue.trim()) {
      addValue(inputValue)
      setInputValue('')
      inputRef.current?.focus()
    }
  }, [inputValue, addValue])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddSingle()
      }
    },
    [handleAddSingle],
  )

  const handleBulkAdd = useCallback(() => {
    const lines = bulkText
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.length > 0) {
      const newValues = [...values]
      for (const line of lines) {
        if (!newValues.includes(line)) {
          newValues.push(line)
        }
      }
      onValuesChange(newValues)
      setBulkText('')
    }
  }, [bulkText, values, onValuesChange])

  const clearAll = useCallback(() => {
    onValuesChange([])
  }, [onValuesChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="size-5" style={{ color: fieldColor }} />
            Множественный выбор: {fieldLabel}
          </DialogTitle>
          <DialogDescription>
            Добавьте несколько значений для поиска. Будут найдены все записи,
            соответствующие любому из указанных значений (логика ИЛИ).
          </DialogDescription>
        </DialogHeader>

        {/* Mode switcher */}
        <div className="flex gap-1 p-0.5 bg-muted rounded-md w-fit">
          <button
            onClick={() => setMode('single')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              mode === 'single'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            По одному
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              mode === 'bulk'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Список / вставка
          </button>
        </div>

        {mode === 'single' ? (
          /* Single value input */
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Введите значение..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddSingle} className="gap-1 shrink-0">
              <Plus className="size-3.5" />
              Добавить
            </Button>
          </div>
        ) : (
          /* Bulk input */
          <div className="space-y-2">
            <textarea
              placeholder="Вставьте значения (каждое с новой строки, через запятую или точку с запятой)..."
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleBulkAdd}
                disabled={!bulkText.trim()}
                className="gap-1.5"
              >
                <ClipboardPaste className="size-3.5" />
                Добавить все
              </Button>
            </div>
          </div>
        )}

        {/* Current values */}
        {values.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Текущие значения ({values.length}):
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Очистить все
              </button>
            </div>
            <ScrollArea className="max-h-[150px]">
              <div className="flex flex-wrap gap-1.5 pr-2">
                {values.map((val, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 py-1 text-xs font-normal"
                  >
                    <span className="max-w-[200px] truncate">{val}</span>
                    <button
                      onClick={() => removeValue(idx)}
                      className="shrink-0 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
