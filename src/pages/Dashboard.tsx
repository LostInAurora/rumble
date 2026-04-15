import { useMemo } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { useSnapshots } from '../hooks/useSnapshots'
import { useConfig } from '../hooks/useConfig'
import { NetValueChart } from '../components/charts/NetValueChart'
import { AllocationPieChart, getAllocationColor } from '../components/charts/AllocationPieChart'
import { PriceStatus } from '../components/PriceStatus'
import type { Market } from '../types'

export function Dashboard() {
  const { config } = useConfig()
  const { holdings, holdingsByMarket, totalRealizedPnl, totalFees } = useHoldings()
  const { accounts } = useCashAccounts()
  const { convert } = useExchangeRates()
  const { snapshots } = useSnapshots()

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)
  const baseCurrency = config?.baseCurrency ?? 'USD'

  const { totalValue, totalCost, holdingValues } = useMemo(() => {
    let totalValue = 0
    let totalCost = 0
    const holdingValues: { name: string; market: string; value: number }[] = []

    for (const h of holdings) {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? h.avgCost
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares

      const convertedMv = convert(marketVal, h.currency, baseCurrency)
      const convertedCost = convert(costVal, h.currency, baseCurrency)

      totalValue += convertedMv
      totalCost += convertedCost
      holdingValues.push({ name: h.symbol, market: h.market, value: convertedMv })
    }

    for (const acc of accounts) {
      const converted = convert(acc.balance, acc.currency, baseCurrency)
      totalValue += converted
      totalCost += converted
      holdingValues.push({ name: acc.name, market: 'CASH', value: converted })
    }

    return { totalValue, totalCost, holdingValues }
  }, [holdings, accounts, getPrice, convert, baseCurrency])

  const unrealizedPnl = totalValue - totalCost
  const totalPnl = unrealizedPnl + totalRealizedPnl
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const allocationData = holdingValues
    .filter(h => h.value > 0)
    .sort((a, b) => b.value - a.value)
    .map(h => ({
      name: h.name,
      value: h.value,
      color: getAllocationColor(h.market),
    }))

  const isUp = totalPnl >= 0
  const pnlSign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Hero Stats */}
      <div className="flex gap-4 animate-fade-in">
        <div className={`flex-1 card-glass p-5 ${isUp ? 'glow-green' : 'glow-red'}`}>
          <div className="label mb-2">Total Value</div>
          <div className="font-data text-3xl font-bold tracking-tight" style={{ color: 'var(--accent-green)' }}>
            {baseCurrency} {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex-1 card-glass p-5">
          <div className="label mb-2">Total P&L</div>
          <div className="font-data text-3xl font-bold tracking-tight" style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {pnlSign}{baseCurrency} {Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                  {item.showSign && item.value >= 0 ? '+' : ''}{baseCurrency} {Math.abs(item.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
        <div className="flex items-center">
          <div className="flex-1">
            <AllocationPieChart data={allocationData} />
          </div>
          <div className="w-36 space-y-2">
            {allocationData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
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
        <div className="label mb-3">Holdings</div>
        {holdings.length === 0 ? (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No holdings yet. Add a transaction to get started.</div>
        ) : (
          <div className="space-y-1">
            {holdings.map(h => {
              const priceInfo = getPrice(h.symbol)
              const currentPrice = priceInfo?.price ?? 0
              const marketVal = convert(currentPrice * h.totalShares, h.currency, baseCurrency)
              const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
              const up = pnlPct >= 0
              return (
                <div key={h.symbol} className="flex items-center justify-between py-2 transition-colors rounded-lg px-2 hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{h.symbol}</span>
                  <div className="text-right">
                    <span className="font-data text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {baseCurrency} {marketVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className={`font-data ml-2 text-xs`} style={{ color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {up ? '+' : ''}{pnlPct.toFixed(1)}%
                      {priceInfo && <PriceStatus stale={priceInfo.stale} />}
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
