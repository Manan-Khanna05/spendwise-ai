import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { computeInsights } from './insights.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data.json')
const PORT = process.env.PORT || 4000

const app = express()
app.use(cors())
app.use(express.json())

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    return []
  }
}

function save(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2))
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'spendwise-ai', expenses: load().length })
})

app.get('/api/expenses', (_req, res) => res.json(load()))

app.post('/api/expenses', (req, res) => {
  const { amount, merchant, category, date } = req.body || {}
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'amount must be > 0' })
  if (!merchant || !String(merchant).trim()) return res.status(400).json({ error: 'merchant is required' })
  const expense = {
    id: req.body.id || Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    amount: Number(amount),
    merchant: String(merchant).trim(),
    note: String(req.body.note || merchant).trim(),
    category: category || 'Other',
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  }
  const expenses = load()
  expenses.unshift(expense)
  save(expenses)
  res.status(201).json(expense)
})

app.delete('/api/expenses/:id', (req, res) => {
  const expenses = load().filter((e) => e.id !== req.params.id)
  save(expenses)
  res.json({ ok: true })
})

app.get('/api/insights', (_req, res) => res.json(computeInsights(load())))

// In production, serve the built Vite frontend from dist/
const dist = path.join(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => console.log(`SpendWise AI server on http://localhost:${PORT}`))
