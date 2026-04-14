import { useState, useMemo } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { useExchangeRates } from '../hooks/useExchangeRates'
import { useConfig } from '../hooks/useConfig'
import { PriceStatus } from '../components/PriceStatus'
import { CashAccountModal } from '../components/CashAccountModal'
import type { Market, Currency } from '../types'
import type { AggregatedHolding } from '../services/portfolio'

const MARKET_LABELS: Record<string, { label: string; color: string }> = {
  US: { label: '🇺🇸 US STOCKS', color: 'var(--accent-blue)' },
  CN: { label: '🇨🇳 A STOCKS', color: 'var(--accent-red)' },
  HK: { label: '🇭🇰 HK STOCKS', color: 'var(--accent-yellow)' },
  CRYPTO: { label: '₿ CRYPTO', color: 'var(--accent-purple)' },
  CASH: { label: '💵 CASH', color: 'var(--accent-green)' },
}

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', CNY: '¥', HKD: 'HK$' }
  const sym = symbols[currency] ?? currency
  if (Math.abs(value) >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`
  return `${sym}${value.toFixed(2)}`
}

export function Holdings() {
  const { config } = useConfig()
  const { holdingsByMarket } = useHoldings()
  const { accounts, addAccount, deleteAccount } = useCashAccounts()
  const { convert } = useExchangeRates()
  const baseCurrency = config?.baseCurrency ?? 'USD'
  const [cashModalOpen, setCashModalOpen] = useState(false)

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (market: string) => setCollapsed(c => ({ ...c, [market]: !c[market] }))

  function renderMarketGroup(market: string, holdings: AggregatedHolding[], currency: Currency) {
    const info = MARKET_LABELS[market]
    if (!info || holdings.length === 0) return null

    let totalMarketValue = 0
    let totalCost = 0

    const rows = holdings.map(h => {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? 0
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares
      totalMarketValue += marketVal
      totalCost += costVal
      const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
      return { ...h, currentPrice, marketVal, pnlPct, stale: priceInfo?.stale ?? true }
    })

    const groupPnlPct = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0
    const isUp = groupPnlPct >= 0

    return (
      <div key={market} className="mb-3">
        <div
          onClick={() => toggle(market)}
          className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <span className="text-xs" style={{ color: info.color }}>{info.label}</span>
          <span className={`text-xs ${isUp ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
            {formatCurrency(totalMarketValue, currency)} ({isUp ? '+' : ''}{groupPnlPct.toFixed(1)}%)
          </span>
        </div>
        {!collapsed[market] && (
          <div className="px-3 mt-1 space-y-0.5">
            {rows.map(r => (
              <div key={r.symbol} className="flex items-center justify-between py-1.5 border-b border-[var(--bg-primary)] text-sm">
                <span className="text-[var(--text-primary)] w-28">{r.symbol}</span>
                <span className="text-[var(--text-secondary)] text-xs">
                  {r.totalShares} @ {formatCurrency(r.currentPrice, currency)}
                </span>
                <span className={r.pnlPct >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>
                  {r.pnlPct >= 0 ? '+' : ''}{r.pnlPct.toFixed(1)}%
                  <PriceStatus stale={r.stale} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderCashGroup() {
    if (accounts.length === 0) return null
    const totalCash = accounts.reduce((sum, acc) => sum + convert(acc.balance, acc.currency, baseCurrency), 0)

    return (
      <div className="mb-3">
        <div
          onClick={() => toggle('CASH')}
          className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] rounded cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: MARKET_LABELS.CASH.color }}>{MARKET_LABELS.CASH.label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setCashModalOpen(true) }}
              className="text-xs text-[var(--accent-green)] hover:underline"
            >
              + Add
            </button>
          </div>
          <span className="text-xs text-[var(--text-secondary)]">{formatCurrency(totalCash, baseCurrency)}</span>
        </div>
        {!collapsed['CASH'] && (
          <div className="px-3 mt-1 space-y-0.5">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between py-1.5 border-b border-[var(--bg-primary)] text-sm">
                <span className="text-[var(--text-primary)]">{acc.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text-secondary)]">{formatCurrency(acc.balance, acc.currency)}</span>
                  <button
                    onClick={() => deleteAccount(acc.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-red)] text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const MARKET_CURRENCY: Record<Market, Currency> = { US: 'USD', CN: 'CNY', HK: 'HKD', CRYPTO: 'USD' }

  return (
    <div className="max-w-2xl mx-auto">
      {(['US', 'CN', 'HK', 'CRYPTO'] as Market[]).map(market =>
        renderMarketGroup(market, holdingsByMarket[market], MARKET_CURRENCY[market])
      )}
      {renderCashGroup()}
      {Object.values(holdingsByMarket).every(g => g.length === 0) && accounts.length === 0 && (
        <div className="text-center text-[var(--text-muted)] py-8">
          No holdings yet. Press ⌘N to add a transaction.
        </div>
      )}
      <CashAccountModal
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        onSave={addAccount}
      />
    </div>
  )
}
