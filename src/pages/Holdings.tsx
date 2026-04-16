import { useState, useMemo } from 'react'
import { useHoldings } from '../hooks/useHoldings'
import { usePrices } from '../hooks/usePrices'
import { useCashAccounts } from '../hooks/useCashAccounts'
import { PriceStatus } from '../components/PriceStatus'
import { CashAccountModal } from '../components/CashAccountModal'
import type { Market } from '../types'
import type { AggregatedHolding } from '../services/portfolio'

const MARKET_LABELS: Record<string, { label: string; color: string }> = {
  US: { label: '🇺🇸 US Stocks', color: 'var(--accent-blue)' },
  CN: { label: '🇨🇳 A Stocks', color: 'var(--accent-red)' },
  HK: { label: '🇭🇰 HK Stocks', color: 'var(--accent-yellow)' },
  CRYPTO: { label: '₿ Crypto', color: 'var(--accent-purple)' },
  CASH: { label: '💵 Cash', color: 'var(--accent-green)' },
}

function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function Holdings() {
  const { holdingsByMarket, deleteBySymbol } = useHoldings()
  const { accounts, addAccount, deleteAccount, adjustBalance } = useCashAccounts()
  const [cashModalOpen, setCashModalOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<{ id: string; name: string; type: 'deposit' | 'withdraw' } | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')

  const symbolsByMarket: Record<Market, string[]> = useMemo(() => ({
    US: holdingsByMarket.US.map(h => h.symbol),
    CN: holdingsByMarket.CN.map(h => h.symbol),
    HK: holdingsByMarket.HK.map(h => h.symbol),
    CRYPTO: holdingsByMarket.CRYPTO.map(h => h.symbol),
  }), [holdingsByMarket])

  const { getPrice } = usePrices(symbolsByMarket)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (market: string) => setCollapsed(c => ({ ...c, [market]: !c[market] }))

  function renderMarketGroup(market: string, holdings: AggregatedHolding[]) {
    const info = MARKET_LABELS[market]
    if (!info || holdings.length === 0) return null

    let totalMarketValue = 0
    let totalCost = 0
    let groupRealizedPnl = 0

    const rows = holdings.map(h => {
      const priceInfo = getPrice(h.symbol)
      const currentPrice = priceInfo?.price ?? 0
      const marketVal = currentPrice * h.totalShares
      const costVal = h.avgCost * h.totalShares
      const unrealizedPnl = marketVal - costVal
      totalMarketValue += marketVal
      totalCost += costVal
      groupRealizedPnl += h.realizedPnl
      const pnlPct = h.avgCost > 0 ? ((currentPrice - h.avgCost) / h.avgCost) * 100 : 0
      return { ...h, currentPrice, marketVal, unrealizedPnl, pnlPct, stale: priceInfo?.stale ?? true }
    })

    const groupUnrealizedPnl = totalMarketValue - totalCost
    const groupTotalPnl = groupUnrealizedPnl + groupRealizedPnl
    const isUp = groupTotalPnl >= 0

    return (
      <div key={market} className="mb-4 animate-fade-in">
        <div
          onClick={() => toggle(market)}
          className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.005]"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs font-semibold tracking-wide" style={{ color: info.color }}>{info.label}</span>
          <span className="font-data text-xs" style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
            {formatUsd(totalMarketValue)}
            <span className="ml-1 opacity-70">({isUp ? '+' : ''}{formatUsd(groupTotalPnl)})</span>
          </span>
        </div>
        {!collapsed[market] && (
          <div className="px-4 mt-2 space-y-1">
            {rows.map(r => (
              <div key={r.symbol} className="group py-3 rounded-lg px-3 transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{r.symbol}</span>
                    <button
                      onClick={() => { if (confirm(`Delete all ${r.symbol} holdings and related transactions?`)) deleteBySymbol(r.symbol) }}
                      className="text-xs transition-colors opacity-0 group-hover:opacity-40 hover:!opacity-100"
                      style={{ color: 'var(--accent-red)' }}
                      title="Delete holding"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="font-data" style={{ color: 'var(--text-primary)' }}>{formatUsd(r.marketVal)}</span>
                    <span className="font-data ml-2" style={{ color: r.pnlPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {r.unrealizedPnl >= 0 ? '+' : ''}{formatUsd(r.unrealizedPnl)}
                      <span className="ml-1 opacity-80">({r.pnlPct >= 0 ? '+' : ''}{r.pnlPct.toFixed(1)}%)</span>
                    </span>
                    <PriceStatus stale={r.stale} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-data">{r.totalShares} shares</span>
                  <span className="font-data">Cost {formatUsd(r.avgCost)} → Now {formatUsd(r.currentPrice)}</span>
                </div>
                {r.realizedPnl !== 0 && (
                  <div className="mt-1 text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
                    Realized: <span style={{ color: r.realizedPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {r.realizedPnl >= 0 ? '+' : ''}{formatUsd(r.realizedPnl)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  function renderCashGroup() {
    const totalCash = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    return (
      <div className="mb-4 animate-fade-in">
        <div
          onClick={() => toggle('CASH')}
          className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.005]"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wide" style={{ color: MARKET_LABELS.CASH.color }}>{MARKET_LABELS.CASH.label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setCashModalOpen(true) }}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors"
              style={{ color: 'var(--accent-green)', background: 'var(--glow-green)' }}
            >
              + Add
            </button>
          </div>
          <span className="font-data text-xs" style={{ color: 'var(--text-secondary)' }}>{formatUsd(totalCash)}</span>
        </div>
        {!collapsed['CASH'] && (
          <div className="px-4 mt-2 space-y-1">
            {accounts.map(acc => (
              <div key={acc.id} className="py-2.5 px-3 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{acc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-data text-sm" style={{ color: 'var(--text-secondary)' }}>{formatUsd(acc.balance)}</span>
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="text-xs transition-colors opacity-40 hover:opacity-100"
                      style={{ color: 'var(--accent-red)' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mt-1.5">
                  <button
                    onClick={() => { setAdjustTarget({ id: acc.id, name: acc.name, type: 'deposit' }); setAdjustAmount('') }}
                    className="text-[10px] font-medium transition-colors hover:underline"
                    style={{ color: 'var(--accent-green)' }}
                  >
                    + Deposit
                  </button>
                  <button
                    onClick={() => { setAdjustTarget({ id: acc.id, name: acc.name, type: 'withdraw' }); setAdjustAmount('') }}
                    className="text-[10px] font-medium transition-colors hover:underline"
                    style={{ color: 'var(--accent-red)' }}
                  >
                    - Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {(['US', 'CRYPTO'] as Market[]).map(market =>
        renderMarketGroup(market, holdingsByMarket[market])
      )}
      {renderCashGroup()}
      {Object.values(holdingsByMarket).every(g => g.length === 0) && accounts.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No holdings yet. Add a transaction to get started.
        </div>
      )}
      <CashAccountModal
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        onSave={addAccount}
      />
      {adjustTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setAdjustTarget(null)}>
          <div className="fixed inset-0 modal-backdrop" />
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const val = parseFloat(adjustAmount)
              if (!val || val <= 0) return
              adjustBalance(adjustTarget.id, adjustTarget.type === 'deposit' ? val : -val)
              setAdjustTarget(null)
            }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xs card-glass p-6 animate-fade-in"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {adjustTarget.type === 'deposit' ? 'Deposit to' : 'Withdraw from'} {adjustTarget.name}
              </h3>
              <button type="button" onClick={() => setAdjustTarget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">✕</button>
            </div>
            <div className="mb-5">
              <label className="label block mb-2">Amount (USD)</label>
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                value={adjustAmount}
                onChange={e => setAdjustAmount(e.target.value)}
                placeholder="1000"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{
                background: adjustTarget.type === 'deposit' ? 'var(--accent-green)' : 'var(--accent-red)',
                color: adjustTarget.type === 'deposit' ? 'var(--bg-primary)' : 'white',
              }}
            >
              {adjustTarget.type === 'deposit' ? 'Deposit' : 'Withdraw'} ⏎
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
