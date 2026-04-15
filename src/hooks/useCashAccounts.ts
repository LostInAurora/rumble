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

  async function adjustBalance(id: string, amount: number) {
    const acc = await db.cashAccounts.get(id)
    if (acc) {
      await db.cashAccounts.update(id, { balance: acc.balance + amount })
    }
  }

  return { accounts: accounts ?? [], addAccount, deleteAccount, updateAccount, adjustBalance }
}
