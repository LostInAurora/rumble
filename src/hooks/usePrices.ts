import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { finnhubProvider } from '../services/price/finnhub'
import { tushareProvider } from '../services/price/tushare'
import { coingeckoProvider } from '../services/price/coingecko'
import { RateLimiter } from '../services/price/rate-limiter'
import type { Market } from '../types'

const finnhubLimiter = new RateLimiter(60, 60_000)
const tushareLimiter = new RateLimiter(200, 60_000)
const coingeckoLimiter = new RateLimiter(10, 60_000)

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

    // US + HK via Finnhub
    const usHkSymbols = needsRefresh([
      ...symbolsByMarket.US,
      ...symbolsByMarket.HK,
    ])
    if (usHkSymbols.length > 0 && config.apiKeys.finnhub) {
      finnhubLimiter.execute(async () => {
        const results = await finnhubProvider.fetchPrices(usHkSymbols, config.apiKeys.finnhub)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
    }

    // CN via Tushare
    const cnSymbols = needsRefresh(symbolsByMarket.CN)
    if (cnSymbols.length > 0 && config.apiKeys.tushare) {
      tushareLimiter.execute(async () => {
        const results = await tushareProvider.fetchPrices(cnSymbols, config.apiKeys.tushare)
        for (const r of results) {
          await db.priceCache.put({ symbol: r.symbol, price: r.price, updatedAt: Date.now() })
        }
      })
    }

    // Crypto via CoinGecko (no key needed)
    const cryptoSymbols = needsRefresh(symbolsByMarket.CRYPTO)
    if (cryptoSymbols.length > 0) {
      coingeckoLimiter.execute(async () => {
        const results = await coingeckoProvider.fetchPrices(cryptoSymbols)
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
