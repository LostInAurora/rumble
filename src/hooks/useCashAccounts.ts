import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { CashAccount } from '../types'

export function useCashAccounts() {
  const accounts = useLiveQuery(() => db.cashAccounts.toArray())

  async function addAccount(account: CashAccount) {
    await db.cashAccounts.put(account)
  }

  async function deleteAccount(id: string) {
    await db.cashAccounts.delete(id)
  }

  async function updateAccount(account: CashAccount) {
    await db.cashAccounts.put(account)
  }

  return { accounts: accounts ?? [], addAccount, deleteAccount, updateAccount }
}
