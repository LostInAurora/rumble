import { describe, it, expect } from 'vitest'
import { aggregateHoldings } from './portfolio'
import type { Transaction } from '../types'

describe('aggregateHoldings', () => {
  it('returns empty array for no transactions', () => {
    expect(aggregateHoldings([])).toEqual([])
  })

  it('aggregates a single BUY transaction', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      symbol: 'AAPL',
      market: 'US',
      currency: 'USD',
      totalShares: 100,
      avgCost: 150,
    })
  })

  it('aggregates multiple BUY transactions for same symbol', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 50, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    expect(result[0].totalShares).toBe(150)
    expect(result[0].avgCost).toBeCloseTo(166.67, 1)
  })

  it('handles SELL reducing shares without changing avgCost', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'SELL', shares: 30, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(1)
    expect(result[0].totalShares).toBe(70)
    expect(result[0].avgCost).toBe(150)
  })

  it('removes holdings with zero shares', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: 'AAPL', market: 'US', type: 'SELL', shares: 100, price: 200, fee: 0, currency: 'USD', date: '2026-02-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(0)
  })

  it('aggregates multiple symbols across markets', () => {
    const txns: Transaction[] = [
      { id: '1', symbol: 'AAPL', market: 'US', type: 'BUY', shares: 100, price: 150, fee: 0, currency: 'USD', date: '2026-01-01' },
      { id: '2', symbol: '600519.SH', market: 'CN', type: 'BUY', shares: 200, price: 1680, fee: 5, currency: 'CNY', date: '2026-01-01' },
      { id: '3', symbol: 'BTC', market: 'CRYPTO', type: 'BUY', shares: 1.5, price: 67200, fee: 0, currency: 'USD', date: '2026-01-01' },
    ]
    const result = aggregateHoldings(txns)
    expect(result).toHaveLength(3)
    expect(result.map(h => h.symbol).sort()).toEqual(['600519.SH', 'AAPL', 'BTC'].sort())
  })
})
