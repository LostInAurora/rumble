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
  const { holdings, holdingsByMarket } = useHoldings()
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

  const { totalValue, totalCost, marketValues } = useMemo(() => {
    let totalValue = 0
    let totalCost = 0
    const marketValues: Record<string, number> = {}

    for (const h of holdings) {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? h.avgCost
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares

      const convertedMv = convert(marketVal, h.currency, baseCurrency)
      const convertedCost = convert(costVal, h.currency, baseCurrency)

      totalValue += convertedMv
      totalCost += convertedCost
      marketValues[h.market] = (marketValues[h.market] ?? 0) + convertedMv
    }

    for (const acc of accounts) {
      const converted = convert(acc.balance, acc.currency, baseCurrency)
      totalValue += converted
      totalCost += converted
      marketValues['CASH'] = (marketValues['CASH'] ?? 0) + converted
    }

    return { totalValue, totalCost, marketValues }
  }, [holdings, accounts, getPrice, convert, baseCurrency])

  const totalPnl = totalValue - totalCost
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const allocationData = Object.entries(marketValues)
    .filter(([, v]) => v > 0)
    .map(([market, value]) => ({
      name: market,
      value,
      color: getAllocationColor(market),
    }))

  const pnlColor = totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'
  const pnlSign = totalPnl >= 0 ? '+' : ''

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-lg border-l-[3px] border-[var(--accent-green)]">
          <div className="text-[9px] uppercase text-[var(--text-muted)]">Total Value</div>
          <div className="text-xl font-bold text-[var(--accent-green)]">
            {baseCurrency} {totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="flex-1 bg-[var(--bg-secondary)] p-4 rounded-lg border-l-[3px] border-[var(--accent-blue)]">
          <div className="text-[9px] uppercase text-[var(--text-muted)]">Total P&L</div>
          <div className="text-xl font-bold" style={{ color: pnlColor }}>
            {pnlSign}{baseCurrency} {Math.abs(totalPnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs" style={{ color: pnlColor }}>
            {pnlSign}{totalPnlPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Net Value</div>
        <NetValueChart snapshots={snapshots} />
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Allocation</div>
        <div className="flex items-center">
          <div className="flex-1">
            <AllocationPieChart data={allocationData} />
          </div>
          <div className="w-32 text-xs space-y-1">
            {allocationData.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <span style={{ color: d.color }}>● {d.name}</span>
                <span className="text-[var(--text-secondary)]">
                  {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg">
        <div className="text-[9px] uppercase text-[var(--text-muted)] mb-2">Holdings</div>
        {holdings.length === 0 ? (
          <div className="text-sm text-[var(--text-muted)]">No holdings yet. Press ⌘N to add a transaction.</div>
        ) : (
          <div className="space-y-1">
            {holdings.map(h => {
              const priceInfo = getPrice(h.symbol)
              const currentPrice = priceInfo?.price ?? 0
              const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
              const isUp = pnlPct >= 0
              return (
                <div key={h.symbol} className="flex items-center justify-between py-1 border-b border-[var(--bg-primary)]">
                  <span className="text-[var(--text-primary)]">{h.symbol}</span>
                  <span className={isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                    {isUp ? '+' : ''}{pnlPct.toFixed(1)}%
                    {priceInfo && <PriceStatus stale={priceInfo.stale} />}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
