import { useCallback, useState, useRef } from "react"
import { useNavigate } from "react-router"
import { MagnifyingGlass } from "@phosphor-icons/react"
import GridFeed from "~/components/GridFeed"
import { useExploreFeed } from "~/queries/feed"
import type { FeedItem } from "~/queries/feed"

export function meta() {
	return [{ title: "Explore — ONYX" }]
}

export default function ExploreTab() {
	const navigate = useNavigate()
	const [searchQuery, setSearchQuery] = useState("")
	const searchRef = useRef<HTMLInputElement>(null)

	const explore = useExploreFeed()

	const feedItems: FeedItem[] =
		explore.data?.pages.flatMap((p) => p.items) ?? []

	const handleRefresh = useCallback(() => {
		explore.refetch()
	}, [explore])

	const handleLoadMore = useCallback(() => {
		if (explore.hasNextPage && !explore.isFetchingNextPage) {
			explore.fetchNextPage()
		}
	}, [explore])

	const handleItemClick = useCallback(
		(item: FeedItem) => {
			navigate(`/${encodeURIComponent(item.creatorId)}`)
		},
		[navigate],
	)

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()
			if (searchQuery.trim()) {
				navigate(
					`/mailbox/me/search?q=${encodeURIComponent(searchQuery.trim())}`,
				)
			}
		},
		[searchQuery, navigate],
	)

	return (
		<div className="min-h-screen bg-kumo-recessed">
			{/* Search bar */}
			<div className="sticky top-0 z-20 border-b border-kumo-line bg-kumo-base/95 px-3 py-3 backdrop-blur">
				<form onSubmit={handleSearch} className="relative">
					<MagnifyingGlass
						size={18}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-kumo-inactive"
						weight="bold"
					/>
					<input
						ref={searchRef}
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search creators and content..."
						className="w-full rounded-xl border border-kumo-line bg-kumo-fill py-2.5 pl-10 pr-4 text-sm text-kumo-default placeholder:text-kumo-inactive focus:border-kumo-brand focus:outline-none focus:ring-1 focus:ring-kumo-brand"
					/>
				</form>
			</div>

			{/* Explore grid */}
			<GridFeed
				items={feedItems}
				isLoading={explore.isLoading}
				hasMore={!!explore.hasNextPage}
				onLoadMore={handleLoadMore}
				onRefresh={handleRefresh}
				onItemClick={handleItemClick}
			/>
		</div>
	)
}
