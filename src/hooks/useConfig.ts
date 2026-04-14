import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { AppConfig } from '../types'

export function useConfig() {
  const config = useLiveQuery(() => db.config.get('default'))

  async function updateConfig(updates: Partial<Omit<AppConfig, 'id'>>) {
    await db.config.update('default', updates)
  }

  return { config, updateConfig }
}
