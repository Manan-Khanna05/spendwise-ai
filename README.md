# SpendWise AI

An AI expense tracker for students. Add an expense, get an instant category
suggestion, and see where your money actually goes — with unusual-spending
alerts, a weekly trend, a month-end forecast, and savings tips.

![Stack](https://img.shields.io/badge/React-18-0071e3) ![TypeScript](https://img.shields.io/badge/TypeScript-5-0071e3) ![Node](https://img.shields.io/badge/Node-Express-0071e3) ![License](https://img.shields.io/badge/License-MIT-0071e3)

## What it does

- **Add expenses** — amount, merchant / note, date, category. The category is
  auto-suggested from the merchant name (e.g. “Swiggy” → Food, “Metro” → Transport).
- **Monthly total + per-category breakdown** — clean CSS bars, no chart library.
- **AI insights** — unusual spending alerts, top category, weekly trend,
  predicted month-end total, and savings suggestions.
- **Budgets per category** — default student budgets (Food ₹5,000, Transport
  ₹1,500, Study ₹2,000, Entertainment ₹1,500, Shopping ₹3,000, Bills ₹2,500,
  Health ₹1,000) with progress bars.
- **Search / filter + export CSV** — filter by text or category, download the
  filtered list as a CSV.
- **Load sample month** — one click loads 26 realistic November 2026 student
  expenses (₹16,274 total) so the dashboard, insights and budgets work instantly.
- **Persistence** — data is stored in the backend JSON file (`server/data.json`)
  via the API, with a localStorage fallback in the browser if the server is down.

## AI — honest note

SpendWise AI is **on-device, rule-based AI — no external API, no key needed**.
It does not use GPT, OpenAI, or any bank sync. The logic is in `src/ai.ts`
(frontend) and `server/insights.js` (backend):

1. **Merchant-keyword classifier** — e.g. swiggy / zomato / dominos → Food,
   ola / uber / metro → Transport, book / udemy → Study.
2. **Anomaly detection** — an expense over ₹500 that is more than **2× the
   median** for its category is flagged as unusual.
3. **Trend** — spending in the last 7 days vs the 7 days before.
4. **Forecast** — linear projection: daily average × days in the month.
5. **Savings tips** — rules, e.g. food over 30% of spend → cook 2 more meals
   a week; entertainment over ₹1,500 → try a free weekend plan.

## UI

Apple Light System — clean, professional Apple.com-style UI, from
`apple.com-design.md`: primary `#0071e3`, secondary `#2997ff`, tertiary
`#0066cc`, neutral `#f5f5f7`, surface `#ffffff`, on-surface `#1d1d1f`,
error `#d92d20`, border `#e5e7eb`. SF Pro Display / Text (system fallback),
large headlines, 17px body at 1.47 line-height, pill buttons (9999px, 44px
high), white cards with a 1px border and 4px radius, no heavy shadows,
no gradients, airy centred layout. Money is formatted in ₹ (INR).

## How to run

```bash
npm install
npm run dev        # backend on http://localhost:4000, frontend on http://localhost:5173
```

Or run them separately:

```bash
npm run dev:server   # node server/index.js
npm run dev:client   # vite
```

Production build:

```bash
npm run build      # tsc + vite build
npm start          # serves the API + the built frontend from dist/ on :4000
```

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/health` | `{ ok, service, expenses }` |
| GET | `/api/expenses` | List all expenses (newest first in the client) |
| POST | `/api/expenses` | Create one. Body: `{ amount, merchant, note?, category?, date? }` |
| DELETE | `/api/expenses/:id` | Delete one |
| GET | `/api/insights` | `computeInsights` result: totals, forecast, by-category, insights |

Data is stored in `server/data.json` (gitignored — your real spending never
goes into git). The frontend also keeps a localStorage copy as a fallback.

## Project structure

```
spendwise-ai/
├── src/
│   ├── App.tsx        # UI: form, stats, bars, insights, budgets, list
│   ├── ai.ts          # classifier + insights (rule-based, no API)
│   ├── sampleData.ts  # 26-expense sample student month
│   ├── types.ts       # Expense / Category / budgets
│   ├── main.tsx
│   └── styles.css     # Apple Light System tokens
├── server/
│   ├── index.js       # Express API + static dist/ serving
│   ├── insights.js    # server copy of the insight rules
│   └── data.json      # gitignored JSON store (created empty)
├── scripts/dev.mjs    # runs backend + Vite together
├── index.html
├── vite.config.ts     # /api proxied to :4000 in dev
└── package.json
```

## Sample month — what the AI says

With “Load sample month” (26 expenses, ₹16,274, 1–14 Nov 2026):

1. **Unusual spend: Amazon — ₹3,499 headphones** — about 5× the usual
   Shopping spend (median ₹720).
2. **Unusual spend: BookMyShow — ₹2,200 concert ticket** — about 6× the
   usual Entertainment spend (median ₹349).
3. **Shopping is your biggest category** — ₹4,219, 26% of the month —
   and the forecast puts the month-end total at ₹34,873 (daily average
   ₹1,162 over the first 14 days × 30 days). The sample only covers
   1–14 Nov, so the projection is high — that is the point: it moves as
   you add data. A third flag also appears: the ₹899 Amazon stationery
   order is 3× the usual Study median (₹325).

## License

MIT — see `LICENSE`. Built by Manan Khanna, BE CSE, Chandigarh University.
