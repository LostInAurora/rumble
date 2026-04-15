import type { Transaction, Market, Currency } from '../types'

export interface AggregatedHolding {
  symbol: string
  market: Market
  currency: Currency
  totalShares: number
  avgCost: number
  realizedPnl: number
  totalFees: number
}

export function aggregateHoldings(transactions: Transaction[]): AggregatedHolding[] {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const map = new Map<string, AggregatedHolding>()

  for (const txn of sorted) {
    let existing = map.get(txn.symbol)

    if (!existing) {
      existing = {
        symbol: txn.symbol,
        market: txn.market,
        currency: txn.currency,
        totalShares: 0,
        avgCost: 0,
        realizedPnl: 0,
        totalFees: 0,
      }
      map.set(txn.symbol, existing)
    }

    existing.totalFees += txn.fee

    if (txn.type === 'BUY') {
      const totalCost = existing.avgCost * existing.totalShares + txn.price * txn.shares
      existing.totalShares += txn.shares
      existing.avgCost = existing.totalShares > 0 ? totalCost / existing.totalShares : 0
    } else {
      // SELL: realized P&L = (sell price - avg cost) * shares sold
      existing.realizedPnl += (txn.price - existing.avgCost) * txn.shares
      existing.totalShares -= txn.shares
    }
  }

  return Array.from(map.values())
}

/** Only holdings with shares > 0 */
export function activeHoldings(transactions: Transaction[]): AggregatedHolding[] {
  return aggregateHoldings(transactions).filter(h => h.totalShares > 0)
}

/** Total realized P&L across all symbols (including fully sold positions) */
export function totalRealizedPnl(transactions: Transaction[]): number {
  return aggregateHoldings(transactions).reduce((sum, h) => sum + h.realizedPnl, 0)
}
