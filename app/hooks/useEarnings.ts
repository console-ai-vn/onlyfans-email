import { useQuery } from "@tanstack/react-query"
import api from "~/services/api"

export interface EarningsTransaction {
  id: string
  date: string
  amount: number
  type: "subscription" | "key" | "tip"
  description: string
}

export interface DailyEarning {
  date: string
  amount: number
}

export interface EarningsData {
  total: number
  lastMonth: number
  change: number
  daily: DailyEarning[]
  transactions: EarningsTransaction[]
}

async function fetchEarnings(creatorId: string): Promise<EarningsData> {
  const res = await fetch(
    `/api/v1/earnings/${encodeURIComponent(creatorId)}`,
  )
  if (!res.ok) throw new Error("Failed to load earnings")
  return res.json()
}

export function useEarnings(creatorId: string) {
  return useQuery({
    queryKey: ["earnings", creatorId],
    queryFn: () => fetchEarnings(creatorId),
    enabled: !!creatorId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
