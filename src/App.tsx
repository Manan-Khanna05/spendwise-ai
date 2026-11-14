import { useEffect, useMemo, useState } from 'react'
import { classifyCategory, computeInsights } from './ai'
import { SAMPLE_EXPENSES } from './sampleData'
import { CATEGORIES, DEFAULT_BUDGETS, inr } from './types'
import type { Category, Expense } from './types'

const API = '/api/expenses'
const LS_KEY = 'spendwise-ai-expenses-v1'

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [apiOnline, setApiOnline] = useState(false)
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [category, setCategory] = useState<Category>('Food')
  const [categoryTouched, setCategoryTouched] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const [error, setError] = useState('')

  // Load: backend first, localStorage fallback
  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((data: Expense[]) => {
        setExpenses(data)
        setApiOnline(true)
        localStorage.setItem(LS_KEY, JSON.stringify(data))
      })
      .catch(() => {
        try {
          setExpenses(JSON.parse(localStorage.getItem(LS_KEY) || '[]'))
        } catch {
          setExpenses([])
        }
      })
  }, [])

  const suggested = useMemo(() => classifyCategory(merchant), [merchant])
  useEffect(() => {
    if (!categoryTouched) setCategory(suggested)
  }, [suggested, categoryTouched])

  const insights = useMemo(() => computeInsights(expenses), [expenses])
  const monthTotal = insights.monthTotal

  const filtered = expenses
    .filter((e) => (filter === 'All' ? true : e.category === filter))
    .filter((e) =>
      search.trim() === ''
        ? true
        : (e.merchant + ' ' + e.note + ' ' + e.category).toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  const maxCat = Math.max(1, ...Object.values(insights.byCategory))

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) return setError('Enter an amount greater than ₹0.')
    if (!merchant.trim()) return setError('Enter a merchant or a short note.')
    setError('')
    const expense: Expense = {
      id: uid(),
      amount: value,
      merchant: merchant.trim(),
      note: merchant.trim(),
      category,
      date,
      createdAt: new Date().toISOString(),
    }
    const next = [expense, ...expenses]
    setExpenses(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    setAmount('')
    setMerchant('')
    setCategoryTouched(false)
    try {
      await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expense) })
    } catch { /* localStorage already saved it */ }
  }

  async function removeExpense(id: string) {
    const next = expenses.filter((e) => e.id !== id)
    setExpenses(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    try { await fetch(`${API}/${id}`, { method: 'DELETE' }) } catch { /* already removed locally */ }
  }

  async function loadSample() {
    for (const s of SAMPLE_EXPENSES) {
      const expense: Expense = { ...s, id: uid(), createdAt: new Date().toISOString() }
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expense) })
        if (!r.ok) throw new Error('api')
      } catch {
        setExpenses((prev) => {
          const next = [expense, ...prev]
          localStorage.setItem(LS_KEY, JSON.stringify(next))
          return next
        })
      }
    }
    // Refresh from the server so the list is exactly what the backend stored.
    try {
      const data: Expense[] = await fetch(API).then((r) => r.json())
      setExpenses(data)
      localStorage.setItem(LS_KEY, JSON.stringify(data))
    } catch { /* keep the local copy */ }
  }

  function exportCsv() {
    const rows = [['Date', 'Merchant', 'Category', 'Amount (INR)'], ...filtered.map((e) => [e.date, e.merchant, e.category, String(e.amount)])]
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'spendwise-expenses.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const insightIcon: Record<string, string> = { alert: '!', trend: '↗', forecast: '◐', tip: '✦', top: '★' }

  return (
    <div className="page">
      <header className="nav">
        <div className="nav-inner">
          <strong>SpendWise AI</strong>
          <span className="nav-links"><a href="#add">Add expense</a><a href="#insights">Insights</a><a href="#budgets">Budgets</a></span>
          <span className="chip">{apiOnline ? 'Backend connected' : 'Offline — saved locally'}</span>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>Know where every rupee goes.</h1>
          <p className="lede">SpendWise AI tracks your spending, spots unusual purchases, and forecasts your month-end total — on your device, with no API key and no bank login.</p>
          <div className="cta-row">
            <a className="btn-primary" href="#add">Add an expense</a>
            <button className="btn-secondary" onClick={loadSample}>Load sample month</button>
          </div>
          <p className="fine">On-device, rule-based AI — no external API, no key needed. Your data stays in your browser and on your own server.</p>
        </section>

        <section className="stats">
          <div className="card stat"><span className="label">Spent this month</span><strong>{inr(monthTotal)}</strong><span className="sub">{expenses.length} expenses</span></div>
          <div className="card stat"><span className="label">Forecast — month end</span><strong>{inr(insights.forecastMonthEnd)}</strong><span className="sub">{inr(insights.dailyAverage)} / day average</span></div>
          <div className="card stat"><span className="label">Top category</span><strong>{insights.topCategory}</strong><span className="sub">{inr(insights.topCategoryAmount)}</span></div>
          <div className="card stat"><span className="label">Daily average</span><strong>{inr(insights.dailyAverage)}</strong><span className="sub">Based on days with spending</span></div>
        </section>

        <section id="add" className="section">
          <h2>Add an expense</h2>
          <form className="card form" onSubmit={addExpense}>
            <label>Amount (₹)<input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 320" /></label>
            <label>Merchant / note<input value={merchant} onChange={(e) => { setMerchant(e.target.value); setCategoryTouched(false) }} placeholder="e.g. Swiggy, Metro, Amazon" /></label>
            <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label>Category
              <select value={category} onChange={(e) => { setCategory(e.target.value as Category); setCategoryTouched(true) }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="hint">AI suggests: {suggested} — change it if it is wrong.</span>
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn-primary" type="submit">Add expense</button>
          </form>
        </section>

        <section className="section">
          <h2>Spending by category</h2>
          {monthTotal === 0 ? (
            <p className="muted">No expenses yet. Add one above, or load the sample month to see the breakdown instantly.</p>
          ) : (
            <div className="card">
              {CATEGORIES.filter((c) => insights.byCategory[c]).map((c) => (
                <div className="bar-row" key={c}>
                  <span className="bar-label">{c}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round((insights.byCategory[c] / maxCat) * 100)}%` }} /></div>
                  <span className="bar-value">{inr(insights.byCategory[c])}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section id="insights" className="section">
          <h2>AI insights</h2>
          <p className="muted">Rule-based, on-device: keyword classification, anomaly detection (&gt; 2× category median), weekly trend and a linear month-end forecast. No GPT, no OpenAI, no bank sync.</p>
          <div className="insights">
            {insights.insights.map((ins, i) => (
              <article className="card insight" key={i}>
                <span className={`badge badge-${ins.type}`}>{insightIcon[ins.type]}</span>
                <div><h3>{ins.title}</h3><p>{ins.detail}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="budgets" className="section">
          <h2>Budgets</h2>
          <div className="budgets">
            {CATEGORIES.map((c) => {
              const spent = insights.byCategory[c] || 0
              const budget = DEFAULT_BUDGETS[c]
              const pct = Math.min(100, Math.round((spent / budget) * 100))
              return (
                <div className="card budget" key={c}>
                  <div className="budget-head"><span>{c}</span><span>{inr(spent)} / {inr(budget)}</span></div>
                  <div className="bar-track"><div className={`bar-fill ${pct >= 100 ? 'bar-over' : ''}`} style={{ width: `${pct}%` }} /></div>
                  <span className="sub">{pct}% used{spent > budget ? ' — over budget' : ''}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="section">
          <div className="list-head">
            <h2>Expenses</h2>
            <button className="btn-secondary" onClick={exportCsv}>Export CSV</button>
          </div>
          <div className="filters">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search merchant or category…" />
            <div className="chips">
              {['All', ...CATEGORIES].map((c) => (
                <button key={c} className={`chip ${filter === c ? 'chip-active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="muted">Nothing matches. Try a different search or category.</p>
          ) : (
            <div className="card list">
              {filtered.map((e) => (
                <div className="expense" key={e.id}>
                  <div><strong>{e.merchant}</strong><span className="sub">{e.date} · {e.category}</span></div>
                  <span className="amount">{inr(e.amount)}</span>
                  <button className="delete" onClick={() => removeExpense(e.id)} aria-label={`Delete ${e.merchant}`}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="footer">
          <p>SpendWise AI — built by Manan Khanna, BE CSE, Chandigarh University. MIT License.</p>
          <p className="fine">Insights are rule-based heuristics running on your device. They are estimates, not financial advice.</p>
        </footer>
      </main>
    </div>
  )
}
