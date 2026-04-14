export interface PriceResult {
  symbol: string
  price: number
}

export interface PriceProvider {
  name: string
  fetchPrices(symbols: string[], apiKey?: string): Promise<PriceResult[]>
}
