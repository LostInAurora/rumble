import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Transaction, Currency } from '../types'

async function adjustCash(currency: Currency, amount: number) {
  const accounts = await db.cashAccounts.where('currency').equals(currency).toArray()
  if (accounts.length > 0) {
    const acc = accounts[0]
    await db.cashAccounts.update(acc.id, { balance: acc.balance + amount })
  } else {
    await db.cashAccounts.put({
      id: crypto.randomUUID(),
      name: currency,
      currency,
      balance: amount,
    })
  }
}

function txnCashImpact(txn: Transaction): number {
  if (txn.type === 'BUY') return -(txn.price * txn.shares + txn.fee)
  return txn.price * txn.shares - txn.fee
}

export function useTransactions() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray()
  )

  async function addTransaction(txn: Transaction) {
    await db.transactions.put(txn)
    await adjustCash(txn.currency, txnCashImpact(txn))
  }

  async function deleteTransaction(id: string) {
    const txn = await db.transactions.get(id)
    if (txn) {
      await db.transactions.delete(id)
      // Reverse the cash impact
      await adjustCash(txn.currency, -txnCashImpact(txn))
    }
  }

  async function updateTransaction(txn: Transaction) {
    const old = await db.transactions.get(txn.id)
    if (old) {
      // Reverse old cash impact, apply new
      await adjustCash(old.currency, -txnCashImpact(old))
    }
    await db.transactions.put(txn)
    await adjustCash(txn.currency, txnCashImpact(txn))
  }

  return { transactions: transactions ?? [], addTransaction, deleteTransaction, updateTransaction }
}
