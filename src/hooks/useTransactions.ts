import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Transaction } from '../types'

export function useTransactions() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  )

  async function addTransaction(txn: Transaction) {
    await db.transactions.put(txn)
  }

  async function deleteTransaction(id: string) {
    await db.transactions.delete(id)
  }

  async function updateTransaction(txn: Transaction) {
    await db.transactions.put(txn)
  }

  return { transactions: transactions ?? [], addTransaction, deleteTransaction, updateTransaction }
}
