import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { finnhubProvider } from '../services/price/finnhub'
import { RateLimiter } from '../services/price/rate-limiter'
import type { Market } from '../types'

const finnhubLimiter = new RateLimiter(60, 60_000)
const failedSymbols = new Set<string>()

export function usePrices(symbolsByMarket: Record<Market, string[]>) {
  const { config } = useConfig()
  const priceCache = useLiveQuery(() => db.priceCache.toArray())

  const priceMap = new Map(priceCache?.map(p => [p.symbol, p]) ?? [])

  const refreshPrices = useCallback(async () => {
    if (!config) return

    const now = Date.now()
    const staleMs = (config.priceRefreshInterval ?? 5) * 60_000

    const allSymbols = [
      ...symbolsByMarket.US,
      ...symbolsByMarket.HK,
      ...symbolsByMarket.CRYPTO,
    ]

    const needsRefresh = allSymbols.filter(s => {
      const cached = priceMap.get(s)
      return !cached || now - cached.updatedAt > staleMs
    })

    // Prioritize previously failed symbols
    const sorted = needsRefresh.sort((a, b) => {
      const aFailed = failedSymbols.has(a) ? 0 : 1
      const bFailed = failedSymbols.has(b) ? 0 : 1
      return aFailed - bFailed
    })

    if (sorted.length > 0 && config.apiKeys.finnhub) {
      for (const symbol of sorted) {
        try {
          await finnhubLimiter.execute(async () => {
            const results = await finnhubProvider.fetchPrices([symbol], config.apiKeys.finnhub)
            if (results.length > 0) {
              await db.priceCache.put({ symbol: results[0].symbol, price: results[0].price, updatedAt: Date.now() })
              failedSymbols.delete(symbol)
            } else {
              failedSymbols.add(symbol)
            }
          })
        } catch {
          failedSymbols.add(symbol)
        }
      }
    }

  }, [config, symbolsByMarket, priceMap])

  // Auto-refresh on mount and on interval
  useEffect(() => {
    refreshPrices()
    const interval = setInterval(refreshPrices, (config?.priceRefreshInterval ?? 5) * 60_000)
    return () => clearInterval(interval)
  }, [refreshPrices, config?.priceRefreshInterval])

  function getPrice(symbol: string): { price: number; stale: boolean } | null {
    const cached = priceMap.get(symbol)
    if (!cached) return null
    const staleMs = (config?.priceRefreshInterval ?? 5) * 60_000
    return { price: cached.price, stale: Date.now() - cached.updatedAt > staleMs }
  }

  return { getPrice, refreshPrices, priceMap }
}
