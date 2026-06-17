import { Button } from "@cloudflare/kumo"
import { ArrowDownIcon, ArrowUpIcon, LightningIcon } from "@phosphor-icons/react"
import type { DailyEarning, EarningsTransaction } from "~/hooks/useEarnings"

interface EarningsDashboardProps {
  total: number
  lastMonth: number
  change: number
  daily: DailyEarning[]
  transactions: EarningsTransaction[]
  onWithdraw?: () => void
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" })
}

const typeBadge: Record<string, { label: string; color: string }> = {
  subscription: {
    label: "Subscription",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  key: {
    label: "Key",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  tip: {
    label: "Tip",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  },
}

export default function EarningsDashboard({
  total,
  lastMonth,
  change,
  daily,
  transactions,
  onWithdraw,
}: EarningsDashboardProps) {
  const maxAmount = Math.max(...daily.map((d) => d.amount), 1)
  const isPositive = change >= 0

  return (
    <div className="space-y-6">
      {/* Total Earnings Card */}
      <div className="rounded-2xl border border-kumo-line bg-gradient-to-br from-kumo-brand/10 to-kumo-brand/5 p-6">
        <p className="text-xs font-medium text-kumo-subtle uppercase tracking-wide">
          Total Earnings
        </p>
        <p className="mt-1 text-3xl font-bold text-kumo-default tabular-nums">
          {formatVnd(total)}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ArrowUpIcon size={12} weight="bold" />
              +{Math.abs(change).toFixed(1)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <ArrowDownIcon size={12} weight="bold" />
              {change.toFixed(1)}%
            </span>
          )}
          <span className="text-xs text-kumo-subtle">vs last month</span>
        </div>
      </div>

      {/* CSS-only Bar Chart */}
      <div className="rounded-2xl border border-kumo-line bg-kumo-base p-4">
        <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wide mb-3">
          Last 30 Days
        </p>
        <div className="flex items-end gap-1 h-32">
          {daily.slice(-30).map((d, i) => {
            const percentage = Math.max((d.amount / maxAmount) * 100, 2)
            const ratio = Math.min(i / 29, 1)
            const r = Math.round(59 + (15 - 59) * ratio)
            const g = Math.round(124 + (82 - 124) * ratio)
            const b = Math.round(217 + (246 - 217) * ratio)
            return (
              <div
                key={d.date}
                className="group relative flex-1 min-w-[4px]"
                title={`${formatDate(d.date)}: ${formatVnd(d.amount)}`}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{
                    height: `${percentage}%`,
                    background: `linear-gradient(to top, rgb(${r},${g},${b}), rgba(59,130,246,0.7))`,
                    minHeight: "2px",
                  }}
                />
                {/* Tooltip on hover (desktop) */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-kumo-base-inverse px-2 py-1 text-[10px] text-kumo-base shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {formatVnd(d.amount)}
                </div>
              </div>
            )
          })}
        </div>
        {/* X-axis labels (first/middle/last) */}
        <div className="mt-2 flex justify-between text-[10px] text-kumo-inactive">
          <span>{formatDate(daily[0]?.date || "")}</span>
          <span>
            {daily.length > 14
              ? formatDate(daily[Math.floor(daily.length / 2)]?.date || "")
              : ""}
          </span>
          <span>
            {formatDate(daily[daily.length - 1]?.date || "")}
          </span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-2xl border border-kumo-line bg-kumo-base">
        <div className="flex items-center justify-between px-4 py-3 border-b border-kumo-line">
          <p className="text-xs font-semibold text-kumo-subtle uppercase tracking-wide">
            Recent Transactions
          </p>
          <span className="text-xs text-kumo-subtle">
            {transactions.length} total
          </span>
        </div>
        <div className="divide-y divide-kumo-line max-h-80 overflow-y-auto">
          {transactions.map((txn) => {
            const badge = typeBadge[txn.type] || typeBadge.subscription
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-kumo-recessed transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-kumo-default truncate">
                    {txn.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-kumo-inactive">
                      {formatDate(txn.date)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
                <span className="ml-3 text-sm font-semibold text-kumo-default tabular-nums shrink-0">
                  {formatVnd(txn.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Withdraw Button */}
      {onWithdraw && (
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-kumo-brand"
          onClick={onWithdraw}
        >
          <LightningIcon size={18} weight="fill" className="mr-2" />
          Withdraw Funds
        </Button>
      )}
    </div>
  )
}
