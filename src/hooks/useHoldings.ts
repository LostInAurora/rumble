import { useMemo } from 'react'
import { useTransactions } from './useTransactions'
import { aggregateHoldings } from '../services/portfolio'
import type { Market } from '../types'

export function useHoldings() {
  const { transactions } = useTransactions()

  const holdings = useMemo(() => aggregateHoldings(transactions), [transactions])

  const holdingsByMarket = useMemo(() => {
    const grouped: Record<Market, typeof holdings> = { US: [], CN: [], HK: [], CRYPTO: [] }
    for (const h of holdings) {
      grouped[h.market].push(h)
    }
    return grouped
  }, [holdings])

  return { holdings, holdingsByMarket }
}
