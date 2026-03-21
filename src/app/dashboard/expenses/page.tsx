'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useToast } from '@/shared/hooks/use-toast'
// import { createClient } from '@/shared/supabase/client' - REMOVED
import { Database } from '@/shared/database/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/shared/utils'
import { Loader2, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react'
import { BackToDashboardButton } from '@/components/BackToDashboardButton'

// Define Transaction type manually since we aren't using Supabase types directly effectively anymore
type Transaction = {
  id: string
  user_id: string
  amount: number
  currency: string
  category: string
  merchant: string | null
  metadata?: any
  created_at: string
}

interface TransactionFormState {
  amount: string
  category: string
  merchant: string
  notes: string
  currency: string
}

const CATEGORY_OPTIONS = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Medical & Healthcare',
  'Investments',
  'Entertainment',
  'Travel',
  'Education',
  'Savings',
  'Other',
]

export default function ExpensesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  // const supabase = createClient() - REMOVED

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'expenses' | 'income'>('expenses')
  const [form, setForm] = useState<TransactionFormState>({
    amount: '',
    category: CATEGORY_OPTIONS[0],
    merchant: '',
    notes: '',
    currency: 'USD',
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const fetchTransactions = async () => {
      setBusy(true)
      try {
        const res = await fetch('/api/user/transactions')
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || 'Failed to fetch')
        setTransactions(data)
      } catch (error: any) {
        toast({
          title: 'Unable to load transactions',
          description: error.message,
          variant: 'destructive',
        })
      }
      setBusy(false)
    }
    fetchTransactions()
  }, [toast, user])

  const totals = useMemo(() => {
    const expenses = transactions.filter((txn) => txn.amount < 0)
    const income = transactions.filter((txn) => txn.amount >= 0)
    const sum = (txns: Transaction[]) => txns.reduce((acc, txn) => acc + txn.amount, 0)
    const byCategory = expenses.reduce<Record<string, number>>((acc, txn) => {
      acc[txn.category] = (acc[txn.category] ?? 0) + Math.abs(txn.amount)
      return acc
    }, {})
    return {
      expensesTotal: Math.abs(sum(expenses)),
      incomeTotal: sum(income),
      net: sum(transactions),
      expensesByCategory: Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    }
  }, [transactions])

  const handleChange =
    (field: keyof TransactionFormState) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }))
      }

  const resetForm = () => {
    setForm({
      amount: '',
      category: CATEGORY_OPTIONS[0],
      merchant: '',
      notes: '',
      currency: 'USD',
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const parsedAmount = Number(form.amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a non-zero number.',
        variant: 'destructive',
      })
      return
    }

    setBusy(true)
    const isIncome = tab === 'income'
    const amount = isIncome ? Math.abs(parsedAmount) : -Math.abs(parsedAmount)

    try {
      const res = await fetch('/api/user/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: form.currency,
          category: form.category,
          merchant: form.merchant || null,
          metadata: {
            payment_method: isIncome ? 'Income' : 'Expense',
            tags: [isIncome ? 'income' : 'expense'],
            notes: form.notes || undefined,
          },
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      toast({
        title: isIncome ? 'Income recorded' : 'Expense recorded',
        description: 'The entry has been saved successfully.',
      })
      setTransactions((prev) => [data, ...prev])
      resetForm()

    } catch (error: any) {
      toast({
        title: 'Unable to save transaction',
        description: error.message,
        variant: 'destructive',
      })
    }
    setBusy(false)
  }

  const handleDelete = async (transactionId: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/user/transactions/${transactionId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')

      toast({ title: 'Entry removed' })
      setTransactions((prev) => prev.filter((txn) => txn.id !== transactionId))
    } catch (error: any) {
      toast({
        title: 'Unable to delete entry',
        description: error.message,
        variant: 'destructive',
      })
    }
    setBusy(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white">Expense Manager</h1>
            <p className="text-white/60">
              Track spending, monitor income, and stay on top of your finances.
            </p>
          </div>
          <BackToDashboardButton />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-400" />
                Monthly Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">
                {formatCurrency(totals.expensesTotal, 'USD')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-white">
                {formatCurrency(totals.incomeTotal, 'USD')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-sky-400" />
                Net Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-semibold ${totals.net >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                {formatCurrency(totals.net, 'USD')}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-white/60">Your latest income and expense entries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {busy && transactions.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-6">
                  No entries yet. Record your first transaction to see it here.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 8).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {txn.merchant || txn.category}
                        </p>
                        <p className="text-xs text-white/60">
                          {formatDate(txn.created_at)} • {txn.amount >= 0 ? 'Income' : 'Expense'}
                          {txn.metadata?.notes ? ` • ${txn.metadata.notes}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${txn.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/50 hover:text-red-300"
                          onClick={() => handleDelete(txn.id)}
                          disabled={busy}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Spend by category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {totals.expensesByCategory.length === 0 ? (
                  <p className="text-sm text-white/60">
                    You haven&apos;t logged any expenses yet.
                  </p>
                ) : (
                  totals.expensesByCategory.map(([category, total]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-white/80">{category}</span>
                      <span className="text-white font-semibold">
                        {formatCurrency(total, 'USD')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Record a transaction</CardTitle>
            <CardDescription className="text-white/60">
              Log income or expenses to keep your finances up to date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="inline-flex rounded-full border border-white/10 bg-white/10 p-1">
              <button
                type="button"
                onClick={() => setTab('expenses')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition ${tab === 'expenses'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setTab('income')}
                className={`px-4 py-1 text-sm font-medium rounded-full transition ${tab === 'income'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
                  }`}
              >
                Income
              </button>
            </div>
            <TransactionForm
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              busy={busy}
              tabLabel={tab === 'income' ? 'income' : 'expense'}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

interface TransactionFormProps {
  form: TransactionFormState
  busy: boolean
  tabLabel: 'income' | 'expense'
  onChange: (
    field: keyof TransactionFormState
  ) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function TransactionForm({ form, busy, onChange, onSubmit, tabLabel }: TransactionFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm text-white/70">Amount ({tabLabel === 'income' ? 'credit' : 'debit'})</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g., 120.50"
          value={form.amount}
          onChange={onChange('amount')}
          className="bg-white/10 border-white/20 text-white"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/70">Category</label>
        <select
          value={form.category}
          onChange={onChange('category')}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option} className="text-black">
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/70">Merchant / Source</label>
        <Input
          placeholder="Where did this occur?"
          value={form.merchant}
          onChange={onChange('merchant')}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-white/70">Currency</label>
        <Input
          placeholder="USD"
          value={form.currency}
          onChange={onChange('currency')}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>
      <div className="md:col-span-2 space-y-2">
        <label className="text-sm text-white/70">Notes</label>
        <textarea
          placeholder="Add additional context..."
          value={form.notes}
          onChange={onChange('notes')}
          className="w-full min-h-[80px] rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" className="bg-white/15 hover:bg-white/25 text-white" disabled={busy}>
          {busy ? 'Saving...' : `Save ${tabLabel}`}
        </Button>
      </div>
    </form>
  )
}
