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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Monthly Returns (%)</div>
        {monthlyReturns.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-muted)] text-sm text-center">
            Need at least 2 months of snapshots to show returns.<br />
            Snapshots are recorded daily when you open the app.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyReturns}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px' }}
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return [`${value.toFixed(2)}%`, 'Return']
                  }
                  return [String(value), 'Return']
                }}
              />
              <Bar dataKey="returnPct" radius={[2, 2, 0, 0]}>
                {monthlyReturns.map((entry, i) => (
                  <Cell key={i} fill={entry.returnPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Transaction Activity</div>
        {activityByMonth.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No transactions yet.</div>
        ) : (
          <div className="space-y-1">
            {activityByMonth.map(({ month, buys, sells }) => (
              <div key={month} className="flex items-center justify-between py-1 border-b border-[var(--bg-primary)]">
                <span className="text-xs text-[var(--text-secondary)]">{month}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-[var(--accent-green)]">{buys} buys</span>
                  <span className="text-[var(--accent-red)]">{sells} sells</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-3">Transactions by Market</div>
        {marketBreakdown.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No transactions yet.</div>
        ) : (
          <div className="space-y-2">
            {marketBreakdown.map(({ market, count }) => {
              const total = marketBreakdown.reduce((s, m) => s + m.count, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={market}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[var(--text-secondary)]">{market}</span>
                    <span className="text-[var(--text-muted)]">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-primary)] rounded overflow-hidden">
                    <div className="h-full bg-[var(--accent-blue)] rounded" style={{ width: `${pct}%` }} />
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
