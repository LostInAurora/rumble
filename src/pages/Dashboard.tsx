import { useMemo, useState } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { useSnapshots } from '../hooks/useSnapshots'
import { NetValueChart } from '../components/charts/NetValueChart'
import { AllocationPieChart, getAllocationColor } from '../components/charts/AllocationPieChart'
import { PriceStatus } from '../components/PriceStatus'
import type { Market } from '../types'

export function Dashboard() {
  const { holdings, allHoldings, holdingsByMarket } = useHoldings()
  const { accounts } = useCashAccounts()
  const { snapshots } = useSnapshots()

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)

  const { totalValue, totalCost, holdingValues, totalRealizedPnl, totalFees } = useMemo(() => {
    let totalValue = 0
    let totalCost = 0
    let totalRealizedPnl = 0
    let totalFees = 0
    const holdingValues: { name: string; market: string; value: number }[] = []

    for (const h of holdings) {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? h.avgCost
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares

      totalValue += marketVal
      totalCost += costVal
      holdingValues.push({ name: h.symbol, market: h.market, value: marketVal })
    }

    for (const acc of accounts) {
      totalValue += acc.balance
      totalCost += acc.balance
      holdingValues.push({ name: acc.name, market: 'CASH', value: acc.balance })
    }

    for (const h of allHoldings) {
      totalRealizedPnl += h.realizedPnl
      totalFees += h.totalFees
    }

    return { totalValue, totalCost, holdingValues, totalRealizedPnl, totalFees }
  }, [holdings, allHoldings, accounts, getPrice])

  const unrealizedPnl = totalValue - totalCost
  const totalPnl = unrealizedPnl + totalRealizedPnl
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const allocationData = holdingValues
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((h, i) => ({
      name: h.name,
      value: h.value,
      color: getAllocationColor(h.market, i),
    }))

  const [sortBy, setSortBy] = useState<'pnl' | 'pnlPct' | 'value'>('pnl')
  const [hideAmounts, setHideAmounts] = useState(false)
  const mask = (text: string) => hideAmounts ? '****' : text
  const isUp = totalPnl >= 0
  const pnlSign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Hide toggle */}
      <div className="flex justify-end animate-fade-in">
        <button
          onClick={() => setHideAmounts(h => !h)}
          className="text-sm px-2 py-1 rounded-lg transition-all hover:scale-105"
          style={{ color: 'var(--text-muted)' }}
          title={hideAmounts ? 'Show amounts' : 'Hide amounts'}
        >
          {hideAmounts ? '◉' : '◎'}
        </button>
      </div>

      {/* Hero Stats */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
        <div className={`flex-1 card-glass p-4 sm:p-5 ${isUp ? 'glow-green' : 'glow-red'}`}>
          <div className="label mb-2">Total Value</div>
          <div className="font-data text-3xl font-bold tracking-tight" style={{ color: 'var(--accent-green)' }}>
            {mask(`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`)}
          </div>
        </div>
        <div className="flex-1 card-glass p-4 sm:p-5">
          <div className="label mb-2">Total P&L</div>
          <div className="font-data text-3xl font-bold tracking-tight" style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {mask(`${pnlSign}$${Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`)}
          </div>
          <div className="font-data text-sm mt-1" style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {pnlSign}{totalPnlPct.toFixed(1)}%
          </div>
          <div className="mt-4 space-y-1.5">
            {[
              { label: 'Unrealized', value: unrealizedPnl, showSign: true },
              { label: 'Realized', value: totalRealizedPnl, showSign: true },
              { label: 'Fees', value: -totalFees, showSign: false },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className="font-data text-xs" style={{
                  color: item.showSign
                    ? item.value >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
                    : 'var(--text-muted)'
                }}>
                  {mask(`${item.showSign && item.value >= 0 ? '+' : ''}$${Math.abs(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Net Value Chart */}
      <div className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="label mb-3">Net Value</div>
        <NetValueChart snapshots={snapshots} />
      </div>

      {/* Allocation */}
      <div className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="label mb-3">Allocation</div>
        <div className="flex flex-col sm:flex-row items-center">
          <div className="flex-1 w-full">
            <AllocationPieChart data={allocationData} />
          </div>
          <div className="w-full sm:w-36 flex flex-wrap gap-x-4 gap-y-1 sm:flex-col sm:gap-x-0 sm:gap-y-2 mt-3 sm:mt-0">
            {allocationData.map(d => (
              <div key={d.name} className="flex items-center gap-1 sm:justify-between">
                <span className="text-xs font-medium" style={{ color: d.color }}>● {d.name}</span>
                <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="card-glass p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="label">Holdings</div>
          <div className="toggle-group">
            {([
              { key: 'pnl', label: 'P&L' },
              { key: 'pnlPct', label: '%' },
              { key: 'value', label: 'Value' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className="px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all"
                style={{
                  background: sortBy === opt.key ? 'var(--accent-green)' : 'transparent',
                  color: sortBy === opt.key ? 'var(--bg-primary)' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {holdings.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No holdings yet. Add a transaction to get started.</div>
        ) : (
          <div className="space-y-1">
            {holdings
              .map(h => {
                const priceInfo = getPrice(h.symbol)
                const currentPrice = priceInfo?.price ?? 0
                const marketVal = currentPrice * h.totalShares
                const costVal = h.avgCost * h.totalShares
                const pnl = marketVal - costVal
                const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
                return { ...h, priceInfo, currentPrice, marketVal, pnl, pnlPct }
              })
              .sort((a, b) => {
                if (sortBy === 'pnlPct') return b.pnlPct - a.pnlPct
                if (sortBy === 'value') return b.marketVal - a.marketVal
                return b.pnl - a.pnl
              })
              .map(h => {
                const up = h.pnlPct >= 0
                return (
                  <div key={h.symbol} className="flex items-center justify-between py-2 transition-colors rounded-lg px-2 hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{h.symbol}</span>
                    <div className="text-right">
                      <span className="font-data text-sm" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {mask(`${up ? '+' : ''}${Math.abs(h.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`)}
                      </span>
                      <span className="font-data ml-2 text-xs" style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {up ? '+' : ''}{h.pnlPct.toFixed(1)}%
                        {h.priceInfo && <PriceStatus stale={h.priceInfo.stale} />}
                      </span>
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
