import { Button } from "@cloudflare/kumo"
import { CheckIcon, CrownIcon, XIcon } from "@phosphor-icons/react"

export interface TierOption {
  name: string
  price: number
  features: Array<{ name: string; included: boolean }>
  highlighted?: boolean
}

interface TierUpgradeCardProps {
  tiers: TierOption[]
  currentTier?: string
  onSelect: (tier: string) => void
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function TierUpgradeCard({
  tiers,
  currentTier,
  onSelect,
}: TierUpgradeCardProps) {
  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible">
        {tiers.map((tier, index) => {
          const isCurrent = currentTier === tier.name
          const isMostPopular = tier.highlighted
          const delayMs = index * 50

          return (
            <div
              key={tier.name}
              className={`relative flex w-[260px] shrink-0 snap-start flex-col rounded-2xl border p-5 transition-all ${
                isCurrent
                  ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                  : isMostPopular
                    ? "border-kumo-brand bg-kumo-brand/5 ring-1 ring-kumo-brand"
                    : "border-kumo-line bg-kumo-base"
              }`}
              style={{
                animation: `slideUp 0.4s ease-out forwards`,
                animationDelay: `${delayMs}ms`,
                opacity: 0,
              }}
            >
              {/* Badges */}
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold text-white">
                  Current
                </div>
              )}
              {isMostPopular && !isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-kumo-brand px-3 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                  <CrownIcon size={10} weight="fill" />
                  Most Popular
                </div>
              )}

              {/* Tier name */}
              <h3 className="text-base font-bold text-kumo-default capitalize mb-3">
                {tier.name}
              </h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-kumo-default">
                  {formatVnd(tier.price)}
                </span>
                <span className="text-xs text-kumo-subtle">/mo</span>
              </div>

              {/* Features */}
              <ul className="mb-5 flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li
                    key={feature.name}
                    className="flex items-start gap-2 text-sm"
                  >
                    {feature.included ? (
                      <CheckIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-500"
                        weight="bold"
                      />
                    ) : (
                      <XIcon
                        size={16}
                        className="mt-0.5 shrink-0 text-kumo-inactive"
                      />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-kumo-default"
                          : "text-kumo-inactive"
                      }
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action */}
              <Button
                variant={isMostPopular ? "primary" : "secondary"}
                size="base"
                className="w-full"
                disabled={isCurrent}
                onClick={() => onSelect(tier.name)}
              >
                {isCurrent ? "Current Plan" : "Upgrade"}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
