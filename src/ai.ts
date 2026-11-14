import type { Category, Expense, Insight, InsightsResult } from './types'

// ---------------------------------------------------------------------------
// SpendWise AI — on-device, rule-based AI. No external API, no key needed.
// 1. Merchant-keyword -> category classifier
// 2. Anomaly detection: expense > 2x the median for its category
// 3. Linear projection: daily average x days in month = month-end forecast
// 4. Rule-based savings tips
// ---------------------------------------------------------------------------

const KEYWORDS: Array<[Category, string[]]> = [
  ['Food', ['swiggy', 'zomato', 'dominos', 'pizza', 'burger', 'cafe', 'coffee', 'chai', 'canteen', 'mess', 'restaurant', 'dhaba', 'subway', 'kfc', 'mcdonald', 'food', 'lunch', 'dinner', 'breakfast', 'snack', 'bakery', 'juice', 'maggi', 'grocery', 'blinkit', 'zepto', 'bigbasket']],
  ['Transport', ['ola', 'uber', 'rapido', 'metro', 'bus', 'auto', 'cab', 'petrol', 'fuel', 'parking', 'train', 'flight', 'rickshaw', 'toll']],
  ['Study', ['book', 'course', 'udemy', 'coursera', 'stationery', 'notebook', 'pen', 'print', 'xerox', 'exam', 'tuition', 'coaching', 'library', 'kindle', 'amazon books']],
  ['Entertainment', ['movie', 'netflix', 'spotify', 'prime', 'hotstar', 'concert', 'game', 'playstation', 'steam', 'youtube', 'cinema', 'pvr', 'party', 'club']],
  ['Shopping', ['amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'shoes', 'shirt', 'jeans', 'headphone', 'earphone', 'phone', 'laptop', 'clothes', 'watch', 'sneaker']],
  ['Bills', ['rent', 'hostel', 'wifi', 'internet', 'recharge', 'electricity', 'water', 'mobile', 'jio', 'airtel', 'subscription', 'fee', 'emi']],
  ['Health', ['pharmacy', 'medicine', 'doctor', 'clinic', 'hospital', 'gym', 'fitness', 'chemist', 'dental']],
]

export function classifyCategory(text: string): Category {
  const hay = text.toLowerCase()
  for (const [category, words] of KEYWORDS) {
    if (words.some((w) => hay.includes(w))) return category
  }
  return 'Other'
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

export function computeInsights(expenses: Expense[], asOf = new Date()): InsightsResult {
  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory: Record<string, number> = {}
  for (const e of expenses) byCategory[e.category] = (byCategory[e.category] || 0) + e.amount

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const topCategory = entries[0]?.[0] ?? '—'
  const topCategoryAmount = entries[0]?.[1] ?? 0

  // Forecast: daily average (from the earliest expense to today) x days in month
  const year = asOf.getFullYear()
  const month = asOf.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayOfMonth = asOf.getDate()
  const firstDate = expenses.length
    ? new Date(Math.min(...expenses.map((e) => new Date(e.date).getTime())))
    : asOf
  const daysElapsed = Math.max(1, Math.floor((asOf.getTime() - firstDate.getTime()) / 86400000) + 1)
  const dailyAverage = monthTotal / daysElapsed
  const forecastMonthEnd = dailyAverage * daysInMonth

  const insights: Insight[] = []

  // 1. Anomalies: > 2x category median (and over ₹500, so small items don't flag)
  for (const e of expenses) {
    const peers = expenses.filter((x) => x.category === e.category && x.id !== e.id).map((x) => x.amount)
    const med = median(peers)
    if (med > 0 && e.amount > 2 * med && e.amount > 500) {
      insights.push({
        type: 'alert',
        title: `Unusual spend: ${e.merchant}`,
        detail: `${'₹' + e.amount.toLocaleString('en-IN')} is ${Math.round(e.amount / med)}× your usual ${e.category} spend (median ${'₹' + Math.round(med).toLocaleString('en-IN')}). Worth a second look.`,
      })
    }
  }

  // 2. Top category
  if (monthTotal > 0) {
    const share = Math.round((topCategoryAmount / monthTotal) * 100)
    insights.push({
      type: 'top',
      title: `${topCategory} is your biggest category`,
      detail: `${'₹' + topCategoryAmount.toLocaleString('en-IN')} — ${share}% of this month's spending.`,
    })
  }

  // 3. Weekly trend: last 7 days vs the 7 days before
  const now = asOf.getTime()
  const last7 = expenses.filter((e) => now - new Date(e.date).getTime() <= 7 * 86400000).reduce((s, e) => s + e.amount, 0)
  const prev7 = expenses.filter((e) => {
    const d = now - new Date(e.date).getTime()
    return d > 7 * 86400000 && d <= 14 * 86400000
  }).reduce((s, e) => s + e.amount, 0)
  if (prev7 > 0) {
    const pct = Math.round(((last7 - prev7) / prev7) * 100)
    insights.push({
      type: 'trend',
      title: pct >= 0 ? `Spending is up ${pct}% this week` : `Spending is down ${Math.abs(pct)}% this week`,
      detail: `${'₹' + last7.toLocaleString('en-IN')} in the last 7 days vs ${'₹' + prev7.toLocaleString('en-IN')} the week before.`,
    })
  }

  // 4. Forecast
  if (monthTotal > 0) {
    insights.push({
      type: 'forecast',
      title: `On track to spend ${'₹' + Math.round(forecastMonthEnd).toLocaleString('en-IN')} this month`,
      detail: `Based on a daily average of ${'₹' + Math.round(dailyAverage).toLocaleString('en-IN')} over ${daysElapsed} day${daysElapsed === 1 ? '' : 's'} in ${daysInMonth}-day month. Linear projection — it moves as you add expenses.`,
    })
  }

  // 5. Rule-based savings tips
  const foodShare = monthTotal > 0 ? (byCategory['Food'] || 0) / monthTotal : 0
  if (foodShare > 0.3) {
    insights.push({
      type: 'tip',
      title: 'Food is over 30% of your spending',
      detail: `Cooking 2 more meals a week instead of ordering could save roughly ${'₹' + Math.round((byCategory['Food'] || 0) * 0.2).toLocaleString('en-IN')} this month (about 20% of food spend).`,
    })
  }
  if ((byCategory['Entertainment'] || 0) > 1500) {
    insights.push({
      type: 'tip',
      title: 'Entertainment is running hot',
      detail: 'Try one free weekend plan — a campus event, a walk, or a movie night at the hostel — instead of a paid outing.',
    })
  }
  if ((byCategory['Transport'] || 0) > 1200) {
    insights.push({
      type: 'tip',
      title: 'Transport adds up fast',
      detail: 'A monthly bus / metro pass is usually cheaper than daily cabs once transport crosses ₹1,200 a month.',
    })
  }
  if (insights.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Add a few expenses to unlock insights',
      detail: 'SpendWise needs at least a few entries to spot unusual spending, trends and a month-end forecast.',
    })
  }

  return { monthTotal, forecastMonthEnd, dailyAverage, topCategory, topCategoryAmount, byCategory, insights }
}
