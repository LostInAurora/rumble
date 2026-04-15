import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface AllocationEntry {
  name: string
  value: number
  color: string
}

interface Props {
  data: AllocationEntry[]
}

const MARKET_COLORS: Record<string, string> = {
  US: 'var(--accent-blue)',
  CN: 'var(--accent-red)',
  HK: 'var(--accent-yellow)',
  CRYPTO: 'var(--accent-purple)',
  CASH: 'var(--accent-green)',
}

export function getAllocationColor(market: string): string {
  return MARKET_COLORS[market] ?? 'var(--text-muted)'
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
