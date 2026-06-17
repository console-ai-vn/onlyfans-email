import { UsersIcon } from "@phosphor-icons/react"

export interface CreatorCardData {
	id: string
	name: string
	avatarUrl?: string | null
	coverUrl?: string | null
	bio?: string | null
	subscriberCount: number
}

interface CreatorCardProps {
	creator: CreatorCardData
	onClick?: () => void
}

export default function CreatorCard({ creator, onClick }: CreatorCardProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="group relative flex w-56 shrink-0 flex-col overflow-hidden rounded-2xl border border-kumo-line bg-kumo-base shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-kumo-brand text-left"
		>
			{/* Cover background */}
			<div className="relative h-20 w-full bg-gradient-to-br from-kumo-brand/50 to-purple-500/30">
				{creator.coverUrl && (
					<img
						src={creator.coverUrl}
						alt=""
						className="absolute inset-0 h-full w-full object-cover opacity-60"
					/>
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
			</div>

			{/* Avatar */}
			<div className="relative -mt-8 mx-auto size-16 overflow-hidden rounded-full border-[3px] border-kumo-base bg-kumo-fill ring-1 ring-kumo-line">
				{creator.avatarUrl ? (
					<img
						src={creator.avatarUrl}
						alt={creator.name}
						className="size-full object-cover"
					/>
				) : (
					<div className="flex size-full items-center justify-center text-xl font-bold text-kumo-subtle">
						{creator.name[0]?.toUpperCase() || "?"}
					</div>
				)}
			</div>

			{/* Info */}
			<div className="flex flex-col items-center p-4 pt-2">
				<h3 className="text-sm font-semibold text-kumo-default line-clamp-1">
					{creator.name}
				</h3>
				{creator.bio && (
					<p className="mt-0.5 text-xs text-kumo-subtle line-clamp-2 text-center">
						{creator.bio}
					</p>
				)}
				<div className="mt-2 flex items-center gap-1 text-xs text-kumo-subtle">
					<UsersIcon size={14} />
					<span>{creator.subscriberCount.toLocaleString()} subscribers</span>
				</div>
			</div>
		</button>
	)
}
