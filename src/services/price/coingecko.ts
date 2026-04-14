import type { PriceProvider, PriceResult } from './types'

const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', DOGE: 'dogecoin',
  ADA: 'cardano', DOT: 'polkadot', AVAX: 'avalanche-2', MATIC: 'matic-network',
  LINK: 'chainlink', UNI: 'uniswap', XRP: 'ripple', BNB: 'binancecoin', LTC: 'litecoin',
}

export function getCoingeckoId(symbol: string): string | undefined {
  return SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()]
}

export const coingeckoProvider: PriceProvider = {
  name: 'coingecko',
  async fetchPrices(symbols: string[]): Promise<PriceResult[]> {
    const idToSymbol = new Map<string, string>()
    for (const symbol of symbols) {
      const id = getCoingeckoId(symbol)
      if (id) idToSymbol.set(id, symbol)
    }
    if (idToSymbol.size === 0) return []
    try {
      const ids = Array.from(idToSymbol.keys()).join(',')
      const resp = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      )
      if (!resp.ok) return []
      const data = await resp.json()
      const results: PriceResult[] = []
      for (const [id, symbol] of idToSymbol) {
        if (data[id]?.usd) {
          results.push({ symbol, price: data[id].usd })
        }
      }
      return results
    } catch {
      return []
    }
  },
}
