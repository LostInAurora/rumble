import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { useSnapshots } from '../hooks/useSnapshots'

export function Analytics() {
  const { snapshots } = useSnapshots()
  const { transactions } = useTransactions()

  const monthlyReturns = useMemo(() => {
    if (snapshots.length < 2) return []
    const monthly: { month: string; returnPct: number }[] = []
    let prevValue = snapshots[0].totalValue

    for (let i = 1; i < snapshots.length; i++) {
      const currMonth = snapshots[i].date.slice(0, 7)
      const prevMonth = snapshots[i - 1].date.slice(0, 7)

      if (currMonth !== prevMonth && prevValue > 0) {
        const returnPct = ((snapshots[i].totalValue - prevValue) / prevValue) * 100
        monthly.push({ month: currMonth, returnPct })
        prevValue = snapshots[i].totalValue
      }
    }
    return monthly
  }, [snapshots])

  const activityByMonth = useMemo(() => {
    const map = new Map<string, { buys: number; sells: number }>()
    for (const txn of transactions) {
      const month = txn.date.slice(0, 7)
      const entry = map.get(month) ?? { buys: 0, sells: 0 }
      if (txn.type === 'BUY') entry.buys++
      else entry.sells++
      map.set(month, entry)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))
  }, [transactions])

  const marketBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const txn of transactions) {
      const count = map.get(txn.market) ?? 0
      map.set(txn.market, count + 1)
    }
    return Array.from(map.entries()).map(([market, count]) => ({ market, count }))
  }, [transactions])

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="card-glass p-5 animate-fade-in">
        <div className="label mb-4">Monthly Returns (%)</div>
        {monthlyReturns.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            Need at least 2 months of snapshots to show returns.<br />
            Snapshots are recorded daily when you open the app.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyReturns}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return [`${value.toFixed(2)}%`, 'Return']
                  }
                  return [String(value), 'Return']
                }}
              />
              <Bar dataKey="returnPct" radius={[4, 4, 0, 0]}>
                {monthlyReturns.map((entry, i) => (
                  <Cell key={i} fill={entry.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="label mb-4">Transaction Activity</div>
        {activityByMonth.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet.</div>
        ) : (
          <div className="space-y-1">
            {activityByMonth.map(({ month, buys, sells }) => (
              <div key={month} className="flex items-center justify-between py-2 px-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>{month}</span>
                <div className="flex gap-4 font-data text-xs">
                  <span style={{ color: 'var(--accent-green)' }}>{buys} buys</span>
                  <span style={{ color: 'var(--accent-red)' }}>{sells} sells</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="label mb-4">Transactions by Market</div>
        {marketBreakdown.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet.</div>
        ) : (
          <div className="space-y-3">
            {marketBreakdown.map(({ market, count }) => {
              const total = marketBreakdown.reduce((s, m) => s + m.count, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={market}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{market}</span>
                    <span className="font-data" style={{ color: 'var(--text-muted)' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
