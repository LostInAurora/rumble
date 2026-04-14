import { useCallback, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useConfig } from './useConfig'
import { fetchExchangeRates } from '../services/price/exchange-rate'
import type { Currency } from '../types'

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export function useExchangeRates() {
  const { config } = useConfig()
  const rates = useLiveQuery(() => db.exchangeRates.toArray())

  const rateMap = new Map(rates?.map(r => [r.pair, r]) ?? [])

  const refreshRates = useCallback(async () => {
    if (!config?.apiKeys.exchangeRate) return

    const baseCurrency = config.baseCurrency
    const cached = rateMap.get(`${baseCurrency}_rates`)
    if (cached && Date.now() - cached.updatedAt < CACHE_DURATION) return

    const newRates = await fetchExchangeRates(baseCurrency, config.apiKeys.exchangeRate)
    for (const [currency, rate] of Object.entries(newRates)) {
      await db.exchangeRates.put({
        pair: `${baseCurrency}_${currency}`,
        rate,
        updatedAt: Date.now(),
      })
    }
    await db.exchangeRates.put({
      pair: `${baseCurrency}_rates`,
      rate: 1,
      updatedAt: Date.now(),
    })
  }, [config, rateMap])

  useEffect(() => {
    refreshRates()
  }, [refreshRates])

  function convert(amount: number, from: Currency, to: Currency): number {
    if (from === to) return amount
    const base = config?.baseCurrency ?? 'USD'

    if (from === base) {
      const rate = rateMap.get(`${base}_${to}`)
      return rate ? amount * rate.rate : amount
    }
    if (to === base) {
      const rate = rateMap.get(`${base}_${from}`)
      return rate ? amount / rate.rate : amount
    }
    const rateFrom = rateMap.get(`${base}_${from}`)
    const rateTo = rateMap.get(`${base}_${to}`)
    if (rateFrom && rateTo) {
      return (amount / rateFrom.rate) * rateTo.rate
    }
    return amount
  }

  return { convert, refreshRates }
}
