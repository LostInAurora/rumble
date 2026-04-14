import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { DailySnapshot } from '../types'

export function useSnapshots() {
  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('date').toArray()
  )

  async function saveSnapshot(snapshot: DailySnapshot) {
    await db.snapshots.put(snapshot)
  }

  return { snapshots: snapshots ?? [], saveSnapshot }
}
