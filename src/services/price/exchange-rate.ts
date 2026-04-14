export interface ExchangeRates {
  [currency: string]: number
}

export async function fetchExchangeRates(
  baseCurrency: string,
  apiKey?: string,
): Promise<ExchangeRates> {
  if (!apiKey) return {}
  try {
    const resp = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
    )
    if (!resp.ok) return {}
    const data = await resp.json()
    if (data.result !== 'success') return {}
    return data.conversion_rates ?? {}
  } catch {
    return {}
  }
}
