export type Category =
  | 'Food'
  | 'Transport'
  | 'Study'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills'
  | 'Health'
  | 'Other'

export interface Expense {
  id: string
  amount: number
  merchant: string
  note: string
  category: Category
  date: string // YYYY-MM-DD
  createdAt: string
}

export interface Insight {
  type: 'alert' | 'trend' | 'forecast' | 'tip' | 'top'
  title: string
  detail: string
}

export interface InsightsResult {
  monthTotal: number
  forecastMonthEnd: number
  dailyAverage: number
  topCategory: string
  topCategoryAmount: number
  byCategory: Record<string, number>
  insights: Insight[]
}

export const CATEGORIES: Category[] = [
  'Food',
  'Transport',
  'Study',
  'Entertainment',
  'Shopping',
  'Bills',
  'Health',
  'Other',
]

export const DEFAULT_BUDGETS: Record<string, number> = {
  Food: 5000,
  Transport: 1500,
  Study: 2000,
  Entertainment: 1500,
  Shopping: 3000,
  Bills: 2500,
  Health: 1000,
  Other: 1000,
}

export const inr = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN')
