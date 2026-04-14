import type { Transaction, Market, Currency } from '../types'

export interface AggregatedHolding {
  symbol: string
  market: Market
  currency: Currency
  totalShares: number
  avgCost: number
}

export function aggregateHoldings(transactions: Transaction[]): AggregatedHolding[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const map = new Map<string, AggregatedHolding>()

  for (const txn of sorted) {
    const existing = map.get(txn.symbol)

    if (txn.type === 'BUY') {
      if (existing) {
        const totalCost = existing.avgCost * existing.totalShares + txn.price * txn.shares
        existing.totalShares += txn.shares
        existing.avgCost = totalCost / existing.totalShares
      } else {
        map.set(txn.symbol, {
          symbol: txn.symbol,
          market: txn.market,
          currency: txn.currency,
          totalShares: txn.shares,
          avgCost: txn.price,
        })
      }
    } else {
      // SELL
      if (existing) {
        existing.totalShares -= txn.shares
      }
    }
  }

  return Array.from(map.values()).filter(h => h.totalShares > 0)
}
