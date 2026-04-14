import type { PriceProvider, PriceResult } from './types'

export const tushareProvider: PriceProvider = {
  name: 'tushare',
  async fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]> {
    if (!apiKey) return []
    const results: PriceResult[] = []
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    for (const symbol of symbols) {
      try {
        const resp = await fetch('https://api.tushare.pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_name: 'daily',
            token: apiKey,
            params: { ts_code: symbol, trade_date: today },
            fields: 'ts_code,close',
          }),
        })
        if (!resp.ok) continue
        const data = await resp.json()
        const items = data?.data?.items
        if (items && items.length > 0) {
          results.push({ symbol, price: items[0][1] })
        }
      } catch {}
    }
    return results
  },
}
