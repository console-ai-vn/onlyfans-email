import { Button } from "@cloudflare/kumo"
import { GiftIcon, KeyIcon, LightningIcon, TicketIcon } from "@phosphor-icons/react"

interface ItemCardProps {
	item: {
		id: string
		name: string
		description: string
		price: number
		imageUrl: string | null
		type: string
	}
	onPurchase: () => void
	purchasing?: boolean
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
	key: { icon: KeyIcon, color: "text-amber-500 bg-amber-50 border-amber-200", label: "Key" },
	token: { icon: LightningIcon, color: "text-purple-500 bg-purple-50 border-purple-200", label: "Token" },
	gift: { icon: GiftIcon, color: "text-pink-500 bg-pink-50 border-pink-200", label: "Gift" },
	pass: { icon: TicketIcon, color: "text-emerald-500 bg-emerald-50 border-emerald-200", label: "Pass" },
}

function formatVnd(amount: number) {
	return new Intl.NumberFormat("vi-VN").format(amount)
}

export default function ItemCard({ item, onPurchase, purchasing = false }: ItemCardProps) {
	const config = typeConfig[item.type] ?? typeConfig.gift
	const Icon = config.icon

	return (
		<div className="flex flex-col rounded-2xl border border-kumo-line bg-kumo-base shadow-sm transition-shadow hover:shadow-md overflow-hidden">
			{/* Image */}
			<div className="relative aspect-video bg-kumo-recessed overflow-hidden">
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center">
						<Icon size={48} className="text-kumo-subtle" weight="duotone" />
					</div>
				)}
				{/* Type badge */}
				<span
					className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.color}`}
				>
					<Icon size={12} weight="fill" />
					{config.label}
				</span>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col p-4 gap-3">
				<div>
					<h3 className="text-base font-semibold text-kumo-default">{item.name}</h3>
					<p className="mt-1 text-sm text-kumo-subtle line-clamp-2">{item.description}</p>
				</div>

				<div className="mt-auto flex items-center justify-between">
					<span className="text-lg font-bold text-kumo-default">
						{formatVnd(item.price)} <span className="text-xs font-normal text-kumo-subtle">VND</span>
					</span>
					<Button
						variant="primary"
						size="sm"
						onClick={onPurchase}
						disabled={purchasing}
					>
						{purchasing ? "Buying..." : "Buy"}
					</Button>
				</div>
			</div>
		</div>
	)
}
