'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ReferenceArea,
} from 'recharts'

interface ChartDataPoint {
  measuredDate: string
  measuredValue: number
  deviation?: number
  isInTolerance?: boolean
}

interface RechartsChartProps {
  data: ChartDataPoint[]
  yMin: number
  yMax: number
  lowerLimit: number | null
  upperLimit: number | null
  refValue: number | null
  unitSymbol: string | null
  paramName: string
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`
    }
    return dateStr
  } catch { return dateStr }
}

function fmtVal(v: number): string {
  // Show 2 decimal places, trim trailing zeros
  return parseFloat(v.toFixed(2)).toString()
}

function CustomDot({
  cx, cy, payload,
}: {
  cx?: number
  cy?: number
  payload?: ChartDataPoint
  index?: number
}) {
  if (cx == null || cy == null || !payload) return null

  const inTol = payload.isInTolerance !== false
  const fill = inTol ? '#10B981' : '#EF4444'

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
    />
  )
}

function CustomActiveDot({
  cx, cy, payload,
}: {
  cx?: number
  cy?: number
  payload?: ChartDataPoint
  index?: number
}) {
  if (cx == null || cy == null || !payload) return null

  const inTol = payload.isInTolerance !== false
  const fill = inTol ? '#10B981' : '#EF4444'

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={fill}
      stroke="#fff"
      strokeWidth={2}
    />
  )
}

function CustomReferenceLineLabel({
  viewBox,
  value,
  position,
}: {
  viewBox?: { x?: number; y?: number; width?: number; height?: number }
  value?: string | number
  position?: string
}) {
  // We don't use this — we use Recharts' built-in label on ReferenceLine instead
  return null
}

export default function RechartsChart({
  data,
  yMin,
  yMax,
  lowerLimit,
  upperLimit,
  refValue,
  unitSymbol,
}: RechartsChartProps) {
  const hasBoth = lowerLimit != null && upperLimit != null
  const hasOnlyLower = lowerLimit != null && upperLimit == null
  const hasOnlyUpper = upperLimit != null && lowerLimit == null
  const unit = unitSymbol ?? ''

  // When only one boundary is set, extend the band to chart edge for shading
  const bandY1 = hasOnlyUpper ? yMin : lowerLimit ?? yMin
  const bandY2 = hasOnlyLower ? yMax : upperLimit ?? yMax

  // Show band when at least one boundary is defined
  const showBand = lowerLimit != null || upperLimit != null

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 70, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="measuredDate"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) => {
            const parts = v.split('-')
            return parts.length === 3 ? `${parts[2]}.${parts[1]}` : v
          }}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11 }}
          allowDataOverflow={false}
          label={
            unit
              ? { value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 11 } }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(val: unknown, _name: string, payload: { payload?: ChartDataPoint }) => {
            const ok = payload?.payload?.isInTolerance !== false
            return [
              typeof val === 'number' ? val.toFixed(2) : val,
              ok ? '✅ В допуске' : '🔴 Вне допуска',
            ]
          }}
          labelFormatter={(label: string) => fmtDate(label)}
        />

        {/* ── Tolerance band (shaded area) ── */}
        {showBand && (
          <ReferenceArea
            y1={bandY1}
            y2={bandY2}
            fill="#d1fae5"
            fillOpacity={0.5}
            ifOverflow="extendDomain"
          />
        )}

        {/* ── Lower tolerance boundary line ── */}
        {lowerLimit != null && (
          <ReferenceLine
            y={lowerLimit}
            stroke="#10B981"
            strokeDasharray="4 2"
            strokeWidth={1.2}
            label={{
              value: `НД: ${fmtVal(lowerLimit)} ${unit}`,
              position: 'insideBottomLeft',
              style: { fontSize: 10, fill: '#059669', fontWeight: 500 },
            }}
          />
        )}

        {/* ── Upper tolerance boundary line ── */}
        {upperLimit != null && (
          <ReferenceLine
            y={upperLimit}
            stroke="#10B981"
            strokeDasharray="4 2"
            strokeWidth={1.2}
            label={{
              value: `ВД: ${fmtVal(upperLimit)} ${unit}`,
              position: 'insideTopLeft',
              style: { fontSize: 10, fill: '#059669', fontWeight: 500 },
            }}
          />
        )}

        {/* ── Nominal reference line ── */}
        {refValue != null && (
          <ReferenceLine
            y={refValue}
            stroke="#64748B"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Ном.: ${fmtVal(refValue)} ${unit}`,
              position: 'insideTopRight',
              style: { fontSize: 10, fill: '#64748B', fontWeight: 500 },
            }}
          />
        )}

        {/* ── Data line ── */}
        <Line
          type="monotone"
          dataKey="measuredValue"
          stroke="#10B981"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={<CustomActiveDot />}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
