import type { Expense } from './types'

// Realistic student month — November 2026, Chandigarh University.
// Total: ₹16,274 across 26 expenses. Includes two deliberate anomalies
// the AI should flag: ₹3,499 headphones (Shopping) and ₹2,200 concert
// (Entertainment) — both well above their category medians.
export const SAMPLE_EXPENSES: Omit<Expense, 'id' | 'createdAt'>[] = [
  { amount: 320, merchant: 'Swiggy', note: 'Dinner — biryani', category: 'Food', date: '2026-11-01' },
  { amount: 120, merchant: 'Campus Canteen', note: 'Lunch thali', category: 'Food', date: '2026-11-01' },
  { amount: 60, merchant: 'Metro', note: 'Metro to Sector 17', category: 'Transport', date: '2026-11-02' },
  { amount: 450, merchant: 'Zomato', note: 'Pizza with friends', category: 'Food', date: '2026-11-02' },
  { amount: 899, merchant: 'Amazon', note: 'Notebook + pens', category: 'Study', date: '2026-11-03' },
  { amount: 199, merchant: 'Spotify', note: 'Student plan', category: 'Entertainment', date: '2026-11-03' },
  { amount: 180, merchant: 'Chai Point', note: 'Chai + bun maska', category: 'Food', date: '2026-11-04' },
  { amount: 250, merchant: 'Ola', note: 'Cab to airport road', category: 'Transport', date: '2026-11-04' },
  { amount: 1499, merchant: 'Jio Recharge', note: 'Monthly mobile recharge', category: 'Bills', date: '2026-11-05' },
  { amount: 540, merchant: 'Dominos', note: 'Pizza night', category: 'Food', date: '2026-11-05' },
  { amount: 3499, merchant: 'Amazon', note: 'Wireless headphones', category: 'Shopping', date: '2026-11-06' },
  { amount: 90, merchant: 'Bus', note: 'Bus pass top-up', category: 'Transport', date: '2026-11-06' },
  { amount: 620, merchant: 'Blinkit', note: 'Groceries — Maggi, milk, eggs', category: 'Food', date: '2026-11-07' },
  { amount: 2200, merchant: 'BookMyShow', note: 'Concert ticket', category: 'Entertainment', date: '2026-11-07' },
  { amount: 350, merchant: 'Print Shop', note: 'Assignment printouts', category: 'Study', date: '2026-11-08' },
  { amount: 280, merchant: 'Swiggy', note: 'Lunch — paneer roll', category: 'Food', date: '2026-11-08' },
  { amount: 499, merchant: 'Netflix', note: 'Shared plan', category: 'Entertainment', date: '2026-11-09' },
  { amount: 110, merchant: 'Metro', note: 'Metro return', category: 'Transport', date: '2026-11-09' },
  { amount: 720, merchant: 'Myntra', note: 'T-shirt', category: 'Shopping', date: '2026-11-10' },
  { amount: 410, merchant: 'Zomato', note: 'Dinner — dosa', category: 'Food', date: '2026-11-10' },
  { amount: 299, merchant: 'Udemy', note: 'React course (sale)', category: 'Study', date: '2026-11-11' },
  { amount: 150, merchant: 'Pharmacy', note: 'Paracetamol + ORS', category: 'Health', date: '2026-11-11' },
  { amount: 480, merchant: 'Swiggy', note: 'Lunch + cold coffee', category: 'Food', date: '2026-11-12' },
  { amount: 200, merchant: 'Rapido', note: 'Bike taxi to campus', category: 'Transport', date: '2026-11-12' },
  { amount: 650, merchant: 'Cafe Coffee Day', note: 'Study session coffee', category: 'Food', date: '2026-11-13' },
  { amount: 1200, merchant: 'Hostel Mess', note: 'Mess fee — November', category: 'Bills', date: '2026-11-14' },
]
