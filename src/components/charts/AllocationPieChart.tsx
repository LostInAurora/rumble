import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface AllocationEntry {
  name: string
  value: number
  color: string
}

interface Props {
  data: AllocationEntry[]
}

const PALETTE = [
  '#00e08e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e879f9', '#facc15', '#fb7185', '#22d3ee',
  '#4ade80', '#818cf8', '#fbbf24', '#f472b6', '#2dd4bf',
]

export function getAllocationColor(_market: string, index: number = 0): string {
  return PALETTE[index % PALETTE.length]
}

export function AllocationPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
        No holdings
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          dataKey="value"
          nameKey="name"
          strokeWidth={2}
          stroke="var(--bg-primary)"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
          formatter={(value) =>
            typeof value === 'number'
              ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : String(value)
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
