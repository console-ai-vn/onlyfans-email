import { Hono } from "hono"
import type { AccessVariables, Env } from "../types"

type EarningsContext = {
  Bindings: Env
  Variables: AccessVariables
}

const app = new Hono<EarningsContext>()

function generateDailyData(days: number) {
  const daily: Array<{ date: string; amount: number }> = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split("T")[0]
    const amount = Math.floor(Math.random() * 200000) + 5000
    daily.push({ date, amount })
  }
  return daily
}

function generateTransactions() {
  const types = ["subscription", "key", "tip"] as const
  const transactions: Array<{
    id: string
    date: string
    amount: number
    type: "subscription" | "key" | "tip"
    description: string
  }> = []

  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i * 2)
    const type = types[Math.floor(Math.random() * types.length)]
    const amount =
      type === "subscription"
        ? 190000 + Math.floor(Math.random() * 800000)
        : type === "key"
          ? 49000
          : 50000 + Math.floor(Math.random() * 450000)
    const descriptions: Record<string, string> = {
      subscription: "Monthly subscription — Pro tier",
      key: "Key purchase ×1",
      tip: "Tip from fan",
    }
    transactions.push({
      id: `txn-${i}-${Date.now()}`,
      date: d.toISOString(),
      amount,
      type,
      description: descriptions[type],
    })
  }
  return transactions
}

// GET /api/v1/earnings/:creatorId
app.get("/api/v1/earnings/:creatorId", async (c) => {
  const creatorId = c.req.param("creatorId")
  if (!creatorId) {
    return c.json({ error: "creatorId required" }, 400)
  }

  const total = 1250000
  const lastMonth = 980000
  const change = +27.5
  const daily = generateDailyData(30)
  const transactions = generateTransactions()

  return c.json({
    total,
    lastMonth,
    change,
    daily,
    transactions,
  })
})

export { app }
