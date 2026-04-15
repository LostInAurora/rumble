import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { finnhubProvider } from '../services/price/finnhub'
import { RateLimiter } from '../services/price/rate-limiter'
import type { Market } from '../types'

const finnhubLimiter = new RateLimiter(60, 60_000)

export function usePrices(symbolsByMarket: Record<Market, string[]>) {
  const { config } = useConfig()
  const priceCache = useLiveQuery(() => db.priceCache.toArray())

  const priceMap = new Map(priceCache?.map(p => [p.symbol, p]) ?? [])

  const refreshPrices = useCallback(async () => {
    if (!config) return

    const now = Date.now()
    const staleMs = (config.priceRefreshInterval ?? 5) * 60_000

    const needsRefresh = (symbols: string[]) =>
      symbols.filter(s => {
        const cached = priceMap.get(s)
        return !cached || now - cached.updatedAt > staleMs
      })

    // US + HK + CRYPTO via Finnhub
    const finnhubSymbols = needsRefresh([
      ...symbolsByMarket.US,
      ...symbolsByMarket.HK,
      ...symbolsByMarket.CRYPTO,
    ])
    if (finnhubSymbols.length > 0 && config.apiKeys.finnhub) {
      finnhubLimiter.execute(async () => {
        const results = await finnhubProvider.fetchPrices(finnhubSymbols, config.apiKeys.finnhub)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
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
