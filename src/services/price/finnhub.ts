import type { PriceProvider, PriceResult } from './types'

const CRYPTO_TO_FINNHUB: Record<string, string> = {
  BTC: 'BINANCE:BTCUSDT', ETH: 'BINANCE:ETHUSDT', SOL: 'BINANCE:SOLUSDT',
  DOGE: 'BINANCE:DOGEUSDT', ADA: 'BINANCE:ADAUSDT', DOT: 'BINANCE:DOTUSDT',
  AVAX: 'BINANCE:AVAXUSDT', LINK: 'BINANCE:LINKUSDT', UNI: 'BINANCE:UNIUSDT',
  XRP: 'BINANCE:XRPUSDT', BNB: 'BINANCE:BNBUSDT', LTC: 'BINANCE:LTCUSDT',
}

export function toFinnhubSymbol(symbol: string): string {
  return CRYPTO_TO_FINNHUB[symbol.toUpperCase()] ?? symbol
}

export const finnhubProvider: PriceProvider = {
  name: 'finnhub',
  async fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]> {
    if (!apiKey) return []
    const results: PriceResult[] = []
    for (const symbol of symbols) {
      try {
        const finnhubSymbol = toFinnhubSymbol(symbol)
        const resp = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${apiKey}`
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
