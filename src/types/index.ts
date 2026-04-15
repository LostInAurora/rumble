export type Market = 'US' | 'CN' | 'HK' | 'CRYPTO'
export type Currency = 'USD'
export type TransactionType = 'BUY' | 'SELL'

export interface Transaction {
  id: string
  symbol: string
  market: Market
  type: TransactionType
  shares: number
  price: number
  fee: number
  currency: Currency
  date: string // ISO date YYYY-MM-DD
  note?: string
}

export interface CashAccount {
  id: string
  name: string
  currency: Currency
  balance: number
}

export interface PriceCache {
  symbol: string
  price: number
  updatedAt: number // timestamp ms
}

export interface DailySnapshot {
  date: string // ISO date YYYY-MM-DD
  totalValue: number
  breakdown: Record<string, number> // market -> value in base currency
}

export interface AppConfig {
  id: string // always 'default'
  apiKeys: {
    finnhub?: string
    tushare?: string
  }
  priceRefreshInterval: number // minutes
}

export interface Holding {
  symbol: string
  market: Market
  currency: Currency
  totalShares: number
  avgCost: number
  currentPrice: number
}

