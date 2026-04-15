import { useMemo } from 'react'
import { useTransactions } from './useTransactions'
import { activeHoldings, aggregateHoldings } from '../services/portfolio'
import type { Market } from '../types'

export function useHoldings() {
  const { transactions, deleteBySymbol } = useTransactions()

  const holdings = useMemo(() => activeHoldings(transactions), [transactions])
  const allHoldings = useMemo(() => aggregateHoldings(transactions), [transactions])

  const totalRealizedPnl = useMemo(
    () => allHoldings.reduce((sum, h) => sum + h.realizedPnl, 0),
    [allHoldings]
  )

  const totalFees = useMemo(
    () => allHoldings.reduce((sum, h) => sum + h.totalFees, 0),
    [allHoldings]
  )

  const holdingsByMarket = useMemo(() => {
    const grouped: Record<Market, typeof holdings> = { US: [], CN: [], HK: [], CRYPTO: [] }
    for (const h of holdings) {
      grouped[h.market].push(h)
    }
    return grouped
  }, [holdings])

  return { holdings, holdingsByMarket, totalRealizedPnl, totalFees, deleteBySymbol }
}
