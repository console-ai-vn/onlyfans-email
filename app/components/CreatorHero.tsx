import { Button } from "@cloudflare/kumo"
import { UsersIcon, ArticleIcon, PackageIcon } from "@phosphor-icons/react"

export interface CreatorHeroData {
	name: string
	bio?: string | null
	avatarUrl?: string | null
	coverUrl?: string | null
	subscriberCount: number
	postCount: number
	itemCount: number
	avatarVersion?: string | null
	coverVersion?: string | null
}

interface CreatorHeroProps {
	creator: CreatorHeroData
	onSubscribe?: () => void
}

function StatsBadge({
	count,
	label,
	icon: Icon,
}: {
	count: number
	label: string
	icon: React.ElementType
}) {
	return (
		<div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm backdrop-blur">
			<Icon size={16} className="text-white/60" />
			<span className="font-semibold text-white">{count.toLocaleString()}</span>
			<span className="text-white/50">{label}</span>
		</div>
	)
}

export default function CreatorHero({ creator, onSubscribe }: CreatorHeroProps) {
	return (
		<div className="relative overflow-hidden">
			{/* Cover image */}
			<div className="relative h-48 w-full bg-gradient-to-r from-kumo-brand/60 to-purple-500/40 sm:h-64 lg:h-72">
				{creator.coverUrl && (
					<img
						src={creator.coverUrl}
						alt=""
						className="absolute inset-0 h-full w-full object-cover"
					/>
				)}
				{/* Gradient overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
			</div>

			{/* Avatar + Info section */}
			<div className="relative -mt-16 px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-5xl">
					<div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
						<div className="flex items-end gap-4">
							{/* Avatar */}
							<div className="relative shrink-0">
								<div className="size-24 overflow-hidden rounded-full border-4 border-kumo-base bg-kumo-fill ring-2 ring-white/10 sm:size-32">
									{creator.avatarUrl ? (
										<img
											src={creator.avatarUrl}
											alt={creator.name}
											className="size-full object-cover"
										/>
									) : (
										<div className="flex size-full items-center justify-center text-3xl font-bold text-kumo-subtle">
											{creator.name[0]?.toUpperCase() || "?"}
										</div>
									)}
								</div>
							</div>

							{/* Name + Bio */}
							<div className="pb-2">
								<h1 className="text-2xl font-bold text-kumo-default sm:text-3xl">
									{creator.name}
								</h1>
								{creator.bio && (
									<div
										className="prose prose-sm mt-1 max-w-lg text-kumo-subtle"
										dangerouslySetInnerHTML={{ __html: creator.bio }}
									/>
								)}
							</div>
						</div>

						{/* Subscribe CTA */}
						{onSubscribe && (
							<Button variant="primary" size="lg" onClick={onSubscribe}>
								Subscribe Now
							</Button>
						)}
					</div>

					{/* Stats bar */}
					<div className="mt-4 flex flex-wrap items-center gap-2 pb-4">
						<StatsBadge
							count={creator.subscriberCount}
							label="subscribers"
							icon={UsersIcon}
						/>
						<StatsBadge
							count={creator.postCount}
							label="posts"
							icon={ArticleIcon}
						/>
						<StatsBadge
							count={creator.itemCount}
							label="items"
							icon={PackageIcon}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
