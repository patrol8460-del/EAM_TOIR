'use client'

import { useState, useCallback, useRef } from 'react'
import { Plus, X, ListPlus, ClipboardPaste, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [bulkText, setBulkText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [pasteStatus, setPasteStatus] = useState<string | null>(null)

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        setBulkText(text)
        setPasteStatus(`Вставлено ${text.length} символов`)
        setTimeout(() => setPasteStatus(null), 2500)
      } else {
        setPasteStatus('Буфер обмена пуст')
        setTimeout(() => setPasteStatus(null), 2500)
      }
    } catch {
      setPasteStatus('Нет доступа к буферу. Используйте Ctrl+V в поле.')
      setTimeout(() => setPasteStatus(null), 3000)
      textareaRef.current?.focus()
    }
  }, [])

  const handleAddAll = useCallback(() => {
    const lines = bulkText
      .split(/[\n,;\t]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (lines.length === 0) return

    const newValues = [...values]
    let added = 0
    for (const line of lines) {
      if (!newValues.includes(line)) {
        newValues.push(line)
        added++
      }
    }
    onValuesChange(newValues)
    setBulkText('')
    setPasteStatus(`Добавлено ${added} значений (${lines.length - added} дубликатов пропущено)`)
    setTimeout(() => setPasteStatus(null), 3000)
  }, [bulkText, values, onValuesChange])

  const removeValue = useCallback(
    (idx: number) => {
      onValuesChange(values.filter((_, i) => i !== idx))
    },
    [values, onValuesChange],
  )

  const clearAll = useCallback(() => {
    onValuesChange([])
  }, [onValuesChange])

  // Reset textarea when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setBulkText('')
        setPasteStatus(null)
      }
      onOpenChange(newOpen)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListPlus className="size-5" style={{ color: fieldColor }} />
            Множественный выбор: {fieldLabel}
          </DialogTitle>
          <DialogDescription>
            Вставьте список значений из буфера обмена или введите вручную.
            Каждое значение — с новой строки, через запятую, точку с запятой или табуляцию.
          </DialogDescription>
        </DialogHeader>

        {/* Paste + textarea area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePasteFromClipboard}
              className="gap-1.5 shrink-0"
            >
              <ClipboardPaste className="size-3.5" />
              Вставить из буфера
            </Button>
            <Button
              size="sm"
              onClick={handleAddAll}
              disabled={!bulkText.trim()}
              className="gap-1.5 shrink-0"
              style={{ backgroundColor: fieldColor, color: '#fff' }}
            >
              <Plus className="size-3.5" />
              Добавить все
            </Button>
          </div>

          <textarea
            ref={textareaRef}
            placeholder={'Вставьте значения сюда (Ctrl+V) или введите вручную.\n\nПример:\nНасос 1\nНасос 2\nНасос 3\n\nИли через запятую: Насос 1, Насос 2, Насос 3'}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full min-h-[120px] rounded-md border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono"
          />

          {/* Paste status */}
          {pasteStatus && (
            <p className="text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-1">
              {pasteStatus}
            </p>
          )}

          {/* Preview count */}
          {bulkText.trim() && (
            <p className="text-xs text-muted-foreground">
              Будет добавлено:{' '}
              {bulkText
                .split(/[\n,;\t]+/)
                .map((s) => s.trim())
                .filter(Boolean).length}{' '}
              значений
            </p>
          )}
        </div>

        {/* Current values */}
        {values.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Текущие значения ({values.length}):
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="size-3" />
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
                    style={{
                      backgroundColor: fieldColor + '18',
                      borderColor: fieldColor + '44',
                      borderWidth: 1,
                    }}
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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
