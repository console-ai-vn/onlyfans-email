import { useUserItems } from "~/queries/inventory"
import { GiftIcon, KeyIcon, LightningIcon, TicketIcon } from "@phosphor-icons/react"

interface InventoryBadgeProps {
	userEmail: string
}

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
	key: { icon: KeyIcon, color: "text-amber-500" },
	token: { icon: LightningIcon, color: "text-purple-500" },
	gift: { icon: GiftIcon, color: "text-pink-500" },
	pass: { icon: TicketIcon, color: "text-emerald-500" },
}

export default function InventoryBadge({ userEmail }: InventoryBadgeProps) {
	const { data: itemsData, isLoading } = useUserItems(userEmail)

	if (isLoading || !itemsData?.items || itemsData.items.length === 0) {
		return null
	}

	const activeItems = itemsData.items.filter((item: Record<string, unknown>) => item.status === "active")

	if (activeItems.length === 0) {
		return null
	}

	// Count by type
	const counts: Record<string, number> = {}
	for (const item of activeItems) {
		const t = (item.item_type as string) || "gift"
		counts[t] = (counts[t] || 0) + 1
	}

	return (
		<div className="inline-flex items-center gap-0.5">
			{Object.entries(counts).map(([type, count]) => {
				const config = typeConfig[type] ?? typeConfig.gift
				const Icon = config.icon
				return (
					<span
						key={type}
						className={`inline-flex items-center gap-0.5 text-xs font-medium ${config.color}`}
						title={`${count} ${type}(s)`}
					>
						<Icon size={14} weight="fill" />
						{count > 1 && <span>{count}</span>}
					</span>
				)
			})}
		</div>
	)
}
