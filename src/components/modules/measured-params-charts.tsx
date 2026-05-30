'use client'

import { useMemo } from 'react'

// ===================== TYPES =====================

interface ChartDataPoint {
  date: string
  value: number
  fullDate: string
  performer: string
  notes: string
  status: 'ok' | 'warn' | 'out'
}

interface RefParsed {
  value: number
  tolMin: number | null
  tolMax: number | null
  raw: string
}

// ===================== HELPERS =====================

function statusColor(status: 'ok' | 'warn' | 'out' | 'none'): string {
  switch (status) {
    case 'out': return '#dc2626'
    case 'warn': return '#d97706'
    case 'none': return '#9ca3af'
    default: return '#16a34a'
  }
}

function overallStatus(points: ChartDataPoint[]): 'ok' | 'warn' | 'out' | 'none' {
  if (!points.length) return 'none'
  if (points.some(p => p.status === 'out')) return 'out'
  if (points.some(p => p.status === 'warn')) return 'warn'
  return 'ok'
}

function fmtNum(v: number): string {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k'
  if (Math.abs(v) >= 1) return v.toFixed(1)
  return v.toFixed(2)
}

// ===================== CHART TOOLTIP =====================

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }>; label?: string }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  const statusLabel = data.status === 'out' ? 'За допуском' : data.status === 'warn' ? 'Отклонение' : 'В норме'
  const sc = data.status === 'out' ? 'text-red-600' : data.status === 'warn' ? 'text-amber-600' : 'text-emerald-600'
  return (
    <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2.5 text-xs min-w-[160px]">
      <p className="font-semibold text-foreground">{label}</p>
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Значение:</span>
          <span className="font-bold text-foreground">{data.value}</span>
        </div>
        {data.performer && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">ФИО:</span>
            <span className="text-foreground truncate max-w-[100px]">{data.performer}</span>
          </div>
        )}
        {data.notes && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Прим.:</span>
            <span className="text-foreground truncate max-w-[100px]">{data.notes}</span>
          </div>
        )}
        <div className={`flex justify-between gap-4 font-semibold ${sc}`}>
          <span>Статус:</span>
          <span>{statusLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ===================== MINI SPARKLINE (inline in card header) =====================

export function MiniSparkline({ data }: { data: ChartDataPoint[]; refParsed: RefParsed | null }) {
  const status = overallStatus(data)
  const lineColor = statusColor(status)

  const minVal = Math.min(...data.map(d => d.value))
  const maxVal = Math.max(...data.map(d => d.value))
  const range = maxVal - minVal || 1
  const h = 16
  const w = 56

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" style={{ display: 'block' }}>
      <polyline
        points={data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * w
          const y = h - ((d.value - minVal) / range) * h
          return `${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * w
        const y = h - ((d.value - minVal) / range) * h
        return <circle key={i} cx={x} cy={y} r={1.2} fill={statusColor(d.status)} />
      })}
    </svg>
  )
}

// ===================== SPARKLINE THUMBNAIL (card in grid) =====================

interface SparklineThumbProps {
  data: ChartDataPoint[]
  status: 'ok' | 'warn' | 'out' | 'none'
  lineColor: string
  name: string
  count: number
  onClick: () => void
}

export function SparklineThumb({ data, lineColor, name, count, onClick }: SparklineThumbProps) {
  const minVal = Math.min(...data.map(d => d.value))
  const maxVal = Math.max(...data.map(d => d.value))
  const range = maxVal - minVal || 1
  const h = 24
  const w = 130

  return (
    <div
      className="rounded-lg border border-border bg-card p-2 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <p className="text-[10px] font-semibold text-foreground truncate mb-1" title={name}>{name}</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" style={{ display: 'block' }}>
        <polyline
          points={data.map((d, i) => {
            const x = (i / Math.max(data.length - 1, 1)) * w
            const y = h - ((d.value - minVal) / range) * h
            return `${x.toFixed(1)},${y.toFixed(1)}`
          }).join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * w
          const y = h - ((d.value - minVal) / range) * h
          return <circle key={i} cx={x} cy={y} r={1.5} fill={statusColor(d.status)} />
        })}
      </svg>
      <div className="flex items-center gap-1 mt-0.5">
        <div className="size-1.5 rounded-full" style={{ backgroundColor: lineColor }} />
        <span className="text-[8px] text-muted-foreground">{count} зам.</span>
      </div>
    </div>
  )
}

// ===================== FULL CHART (dialog) =====================

interface FullChartProps {
  data: ChartDataPoint[]
  refParsed: RefParsed | null
}

export function FullChart({ data, refParsed }: FullChartProps) {
  // ── Compute domain & bounds ──
  const { lowerBound, upperBound, yMin, yMax } = useMemo(() => {
    if (!data.length) return { lowerBound: null as number | null, upperBound: null as number | null, yMin: 0, yMax: 100 }
    const allVals = data.map(d => d.value)
    let lb: number | null = null
    let ub: number | null = null
    if (refParsed) {
      lb = refParsed.tolMin != null ? refParsed.value * (1 + refParsed.tolMin / 100) : null
      ub = refParsed.tolMax != null ? refParsed.value * (1 + refParsed.tolMax / 100) : null
    }
    const valsForDomain = [...allVals, ...(lb != null ? [lb] : []), ...(ub != null ? [ub] : []), ...(refParsed ? [refParsed.value] : [])]
    const dataMin = Math.min(...valsForDomain)
    const dataMax = Math.max(...valsForDomain)
    const range = dataMax - dataMin || Math.abs(dataMax) * 0.2 || 1
    const padding = range * 0.18
    return { lowerBound: lb, upperBound: ub, yMin: Math.min(dataMin - padding, dataMin - range * 0.05), yMax: Math.max(dataMax + padding, dataMax + range * 0.05) }
  }, [data, refParsed])

  // ── Statistics ──
  const stats = useMemo(() => {
    if (!data.length) return null
    const values = data.map(d => d.value)
    const avg = values.reduce((s, v) => s + v, 0) / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const outCount = data.filter(d => d.status === 'out').length
    const okCount = data.filter(d => d.status === 'ok').length
    return { avg, min, max, outCount, okCount, total: values.length }
  }, [data])

  // ── Not enough data ──
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
        <p className="text-sm">Недостаточно данных для построения графика</p>
        <p className="text-xs mt-1">Необходимо минимум 2 записи замеров</p>
      </div>
    )
  }

  // ── SVG coordinate system (viewBox) ──
  // Wide enough for right-side annotations
  const vbW = 680
  const vbH = 240
  const padL = 52
  const padR = 80   // space for right-side ref/tol labels
  const padT = 12
  const padB = 32
  const plotW = vbW - padL - padR
  const plotH = vbH - padT - padB

  // Y axis
  const yRange = yMax - yMin || 1
  const yTicks = 5
  const yValues = Array.from({ length: yTicks }, (_, i) => yMin + (yRange / (yTicks - 1)) * i)

  // Scale functions
  const yScale = (val: number) => padT + plotH - ((val - yMin) / yRange) * plotH
  const xScale = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * plotW

  // ── Check if ref labels would overlap (too close) ──
  const refAnnotations: { label: string; y: number; color: string }[] = []
  if (refParsed) {
    const yRef = yScale(refParsed.value)
    refAnnotations.push({ label: `Реф: ${refParsed.value}`, y: yRef, color: '#059669' })
    if (lowerBound != null) {
      const yLb = yScale(Math.max(lowerBound, yMin))
      refAnnotations.push({ label: `${lowerBound.toFixed(2)}`, y: yLb, color: '#dc2626' })
    }
    if (upperBound != null) {
      const yUb = yScale(Math.min(upperBound, yMax))
      refAnnotations.push({ label: `${upperBound.toFixed(2)}`, y: yUb, color: '#dc2626' })
    }
  }

  // Deduplicate overlapping annotations
  const dedupedAnnotations = refAnnotations.filter((a, i, arr) => {
    return arr.findIndex(b => Math.abs(b.y - a.y) < 14) === i
  })

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-5 gap-1.5">
          <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">Среднее</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{stats.avg.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">Мин</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{stats.min.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-muted/40 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">Макс</p>
            <p className="text-sm font-bold text-foreground mt-0.5">{stats.max.toFixed(2)}</p>
          </div>
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-emerald-600 font-medium leading-tight">В норме</p>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">{stats.okCount}</p>
          </div>
          <div className="rounded-md bg-red-50 border border-red-200 px-2 py-1.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-red-600 font-medium leading-tight">За допуском</p>
            <p className="text-sm font-bold text-red-700 mt-0.5">{stats.outCount}</p>
          </div>
        </div>
      )}

      {/* Chart container — responsive, contained */}
      <div className="w-full rounded-lg border border-border/60 bg-gradient-to-b from-white to-gray-50/50 p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${vbW} ${vbH}`}
          className="w-full h-auto"
          style={{ display: 'block', maxHeight: '380px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* ── Grid lines ── */}
          {yValues.map((v, i) => (
            <line
              key={`grid-${i}`}
              x1={padL} y1={yScale(v)} x2={padL + plotW} y2={yScale(v)}
              stroke="#e5e7eb" strokeDasharray="3,3" strokeWidth={0.5}
            />
          ))}

          {/* ── Axes ── */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#d1d5db" strokeWidth={0.8} />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#d1d5db" strokeWidth={0.8} />

          {/* ── Tolerance band (green area) ── */}
          {refParsed && lowerBound != null && upperBound != null && (() => {
            const yLow = yScale(Math.max(lowerBound, yMin))
            const yHigh = yScale(Math.min(upperBound, yMax))
            const bandH = Math.max(yLow - yHigh, 1)
            return (
              <rect
                x={padL} y={yHigh} width={plotW} height={bandH}
                fill="#16a34a" fillOpacity={0.07}
                stroke="#16a34a" strokeOpacity={0.15} strokeDasharray="4,4" strokeWidth={0.5}
              />
            )
          })()}

          {/* ── Reference line (dashed green) ── */}
          {refParsed && (
            <line
              x1={padL} y1={yScale(refParsed.value)}
              x2={padL + plotW} y2={yScale(refParsed.value)}
              stroke="#059669" strokeDasharray="6,3" strokeWidth={1.5}
            />
          )}

          {/* ── Tolerance bound lines (dashed red) ── */}
          {refParsed && lowerBound != null && (
            <line
              x1={padL} y1={yScale(Math.max(lowerBound, yMin))}
              x2={padL + plotW} y2={yScale(Math.max(lowerBound, yMin))}
              stroke="#dc2626" strokeDasharray="3,3" strokeWidth={0.8} strokeOpacity={0.5}
            />
          )}
          {refParsed && upperBound != null && (
            <line
              x1={padL} y1={yScale(Math.min(upperBound, yMax))}
              x2={padL + plotW} y2={yScale(Math.min(upperBound, yMax))}
              stroke="#dc2626" strokeDasharray="3,3" strokeWidth={0.8} strokeOpacity={0.5}
            />
          )}

          {/* ── Data line (gradient-like shadow + main line) ── */}
          <polyline
            points={data.map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.value).toFixed(1)}`).join(' ')}
            fill="none" stroke="#d1d5db" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.4}
            transform="translate(0,1)"
          />
          <polyline
            points={data.map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.value).toFixed(1)}`).join(' ')}
            fill="none" stroke="#4b5563" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />

          {/* ── Data dots (outer ring + inner fill) ── */}
          {data.map((d, i) => {
            const cx = xScale(i)
            const cy = yScale(d.value)
            const c = statusColor(d.status)
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={5} fill="white" stroke={c} strokeWidth={2} opacity={0.35} />
                <circle cx={cx} cy={cy} r={3} fill={c} stroke="white" strokeWidth={1.5} />
              </g>
            )
          })}

          {/* ── Y-axis labels ── */}
          {yValues.map((v, i) => (
            <text
              key={`yl-${i}`}
              x={padL - 6} y={yScale(v) + 3.5}
              textAnchor="end" fontSize={9} fill="#9ca3af" fontFamily="system-ui, sans-serif"
            >
              {fmtNum(v)}
            </text>
          ))}

          {/* ── X-axis labels (rotated dates) ── */}
          {data.map((d, i) => {
            const x = xScale(i)
            const anchor = i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'
            const yBase = padT + plotH + 14
            return (
              <text
                key={`xl-${i}`}
                x={x} y={yBase}
                textAnchor={anchor}
                fontSize={8} fill="#9ca3af" fontFamily="system-ui, sans-serif"
                transform={`rotate(-35,${x},${yBase})`}
              >
                {d.date}
              </text>
            )
          })}

          {/* ── Right-side annotation labels ── */}
          {dedupedAnnotations.map((ann, i) => (
            <g key={`ann-${i}`}>
              <line
                x1={padL + plotW + 2} y1={ann.y}
                x2={padL + plotW + 8} y2={ann.y}
                stroke={ann.color} strokeWidth={1}
              />
              <text
                x={padL + plotW + 10} y={ann.y + 3}
                textAnchor="start" fontSize={9} fill={ann.color}
                fontWeight={600} fontFamily="system-ui, sans-serif"
              >
                {ann.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground pt-0.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-emerald-500" />
          <span>В норме</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-amber-500" />
          <span>Отклонение</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500" />
          <span>За допуском</span>
        </div>
        {refParsed && (
          <>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="8" className="overflow-visible">
                <line x1="0" y1="4" x2="16" y2="4" stroke="#059669" strokeWidth={1.5} strokeDasharray="4,2" />
              </svg>
              <span>Референс</span>
            </div>
            {lowerBound != null && upperBound != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 bg-emerald-100 border border-emerald-200 rounded-sm" />
                <span>Допуск</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
