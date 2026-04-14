import type { PriceProvider, PriceResult } from './types'

export const finnhubProvider: PriceProvider = {
  name: 'finnhub',
  async fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]> {
    if (!apiKey) return []
    const results: PriceResult[] = []
    for (const symbol of symbols) {
      try {
        const resp = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`
        )
        if (!resp.ok) continue
        const data = await resp.json()
        if (data.c && data.c > 0) {
          results.push({ symbol, price: data.c })
        }
      } catch {
        // Skip failed symbols
      }
    }
    return results
  },
}
