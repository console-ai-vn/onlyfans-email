import { Button, Loader, Tabs } from "@cloudflare/kumo"
import { useCallback, useState } from "react"
import { useNavigate, useParams } from "react-router"
import ContentGrid from "~/components/ContentGrid"
import CreatorHero from "~/components/CreatorHero"
import ItemCard from "~/components/ItemCard"
import { SkeletonHero, SkeletonGrid } from "~/components/SkeletonLoader"
import {
	useCreatorContent,
	useCreatorProfile,
	useCreatorShop,
} from "~/queries/creator"
import type { ContentGridItem } from "~/components/ContentGrid"
import type { ContentTier } from "~/components/ContentTierBadge"

export function meta({
	data,
}: {
	data: ReturnType<typeof useCreatorProfile>
}) {
	if (!data?.data) {
		return [
			{ title: "Creator Profile — ONYX" },
			{
				name: "description",
				content: "Discover exclusive content from creators on ONYX.",
			},
		]
	}
	const c = data.data
	return [
		{ title: `${c.name} — ONYX` },
		{
			name: "description",
			content:
				c.bio?.replace(/<[^>]*>/g, "").slice(0, 160) ||
				`Subscribe to ${c.name} on ONYX for exclusive content.`,
		},
		{ property: "og:title", content: `${c.name} on ONYX` },
		{
			property: "og:description",
			content:
				c.bio?.replace(/<[^>]*>/g, "").slice(0, 200) ||
				`Check out ${c.name}'s exclusive content on ONYX.`,
		},
		{ property: "og:image", content: c.avatarUrl || "/favicon.svg" },
		{ property: "og:type", content: "profile" },
	]
}

export default function CreatorRoute() {
	const { creatorId } = useParams<{ creatorId: string }>()
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState("posts")
	const [contentPage, setContentPage] = useState(1)

	const profile = useCreatorProfile(creatorId!)
	const content = useCreatorContent(creatorId!, contentPage)
	const shop = useCreatorShop(creatorId!)

	const creator = profile.data

	const handleSubscribe = useCallback(() => {
		if (creator) {
			navigate(`/signup?creator=${encodeURIComponent(creator.id)}`)
		}
	}, [creator, navigate])

	const handleItemClick = useCallback(
		(item: ContentGridItem) => {
			// Navigate to item detail or open gate modal
			console.log("Item clicked:", item.id)
		},
		[],
	)

	const handleUnlockItem = useCallback(async (item: ContentGridItem) => {
		navigate(`/checkout?itemId=${encodeURIComponent(item.id)}`)
	}, [navigate])

	// Loading state
	if (profile.isLoading) {
		return (
			<div className="min-h-screen bg-kumo-recessed">
				<SkeletonHero />
				<div className="mx-auto max-w-5xl px-4 py-8">
					<div className="mb-6 h-10 w-40 rounded bg-kumo-fill animate-pulse" />
					<SkeletonGrid count={8} cols={4} />
				</div>
			</div>
		)
	}

	// Error state
	if (profile.isError || !creator) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-kumo-recessed p-8">
				<div className="rounded-2xl border border-kumo-line bg-kumo-base p-8 text-center">
					<h1 className="text-xl font-bold text-kumo-default">
						Creator Not Found
					</h1>
					<p className="mt-2 text-kumo-subtle">
						This creator page doesn't exist or may have been removed.
					</p>
					<Button
						variant="primary"
						className="mt-6"
						onClick={() => navigate("/")}
					>
						Go Home
					</Button>
				</div>
			</div>
		)
	}

	const contentItems: ContentGridItem[] =
		content.data?.items?.map((post) => ({
			id: post.id,
			thumbnailUrl: post.thumbnailUrl,
			title: post.title,
			tier: post.tier as ContentTier,
			isUnlocked: post.isUnlocked,
			keyPrice: post.keyPrice,
			previewUrl: post.previewUrl,
		})) ?? []

	const shopItems = shop.data ?? []

	return (
		<div className="min-h-screen bg-kumo-recessed">
			{/* Creator Hero */}
			<CreatorHero
				creator={{
					name: creator.name,
					bio: creator.bio,
					avatarUrl: creator.avatarUrl,
					coverUrl: creator.coverUrl,
					subscriberCount: creator.subscriberCount,
					postCount: creator.postCount,
					itemCount: creator.itemCount,
					avatarVersion: creator.avatarVersion,
					coverVersion: creator.coverVersion,
				}}
				onSubscribe={handleSubscribe}
			/>

			{/* Tabs */}
			<div className="mx-auto max-w-5xl px-4 pt-6">
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					tabs={[
						{ value: "posts", label: `Posts (${creator.postCount})` },
						{ value: "shop", label: `Shop (${creator.itemCount})` },
					]}
				/>
			</div>

			{/* Tab content */}
			<div className="mx-auto max-w-5xl px-4 py-6">
				{activeTab === "posts" && (
					<>
						{content.isLoading ? (
							<SkeletonGrid count={8} cols={4} />
						) : (
							<ContentGrid
								items={contentItems}
								onItemClick={handleItemClick}
								onUnlockItem={handleUnlockItem}
							/>
						)}

						{/* Pagination */}
						{content.data && content.data.totalCount > content.data.limit && (
							<div className="mt-8 flex items-center justify-center gap-2">
								<Button
									variant="secondary"
									size="sm"
									disabled={contentPage <= 1}
									onClick={() => setContentPage((p) => Math.max(1, p - 1))}
								>
									Previous
								</Button>
								<span className="text-sm text-kumo-subtle">
									Page {contentPage} of{" "}
									{Math.ceil(content.data.totalCount / content.data.limit)}
								</span>
								<Button
									variant="secondary"
									size="sm"
									disabled={
										contentPage >=
										Math.ceil(content.data.totalCount / content.data.limit)
									}
									onClick={() => setContentPage((p) => p + 1)}
								>
									Next
								</Button>
							</div>
						)}
					</>
				)}

				{activeTab === "shop" && (
					<>
						{shop.isLoading ? (
							<SkeletonGrid count={6} cols={3} />
						) : shopItems.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<p className="text-kumo-subtle">No items in shop yet</p>
								<p className="mt-1 text-sm text-kumo-inactive">
									This creator hasn't added any items to their shop.
								</p>
							</div>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{shopItems.map((item) => (
									<ItemCard
										key={item.id}
										item={{
											id: item.id,
											name: item.name,
											description: item.description,
											price: item.price,
											imageUrl: item.imageUrl,
											type: item.type,
										}}
										onPurchase={() => {
											navigate(
												`/checkout?itemId=${encodeURIComponent(item.id)}`,
											)
										}}
									/>
								))}
							</div>
						)}
					</>
				)}
			</div>

			{/* Structured data for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Person",
						name: creator.name,
						description: creator.bio?.replace(/<[^>]*>/g, ""),
						url: `https://start.onyx.com.vn/${encodeURIComponent(creator.id)}`,
						image: creator.avatarUrl,
					}),
				}}
			/>
		</div>
	)
}
