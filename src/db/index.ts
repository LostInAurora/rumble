import Dexie, { type Table } from 'dexie'
import type { Transaction, CashAccount, PriceCache, DailySnapshot, AppConfig } from '../types'

export class PortfolioDB extends Dexie {
  transactions!: Table<Transaction, string>
  cashAccounts!: Table<CashAccount, string>
  priceCache!: Table<PriceCache, string>
  snapshots!: Table<DailySnapshot, string>
  config!: Table<AppConfig, string>

  constructor() {
    super('tv-portfolio')
    this.version(1).stores({
      transactions: 'id, symbol, market, date',
      cashAccounts: 'id, currency',
      priceCache: 'symbol',
      snapshots: 'date',
      config: 'id',
    })
  }
}

export const db = new PortfolioDB()

// Seed default config if none exists
db.on('ready', async () => {
  const existing = await db.config.get('default')
  if (!existing) {
    await db.config.put({
      id: 'default',
      apiKeys: {},
      priceRefreshInterval: 5,
    })
  }
})
