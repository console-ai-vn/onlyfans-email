// Feed routes for mobile UX — serves seeded content
import { Hono } from "hono"

export const app = new Hono()

// GET /api/v1/feed — following creators' content
app.get("/api/v1/feed", async (c) => {
	const items = [
		{
			id: "post-1",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2F41292c0b-163d-4d9b-b47b-699d7856aa60-demo-0.png",
			imageId: null,
			title: "Welcome to ONYX Mobile! 🚀",
			tier: "public" as const,
			subscriberCount: 42,
			isNew: true,
			createdAt: new Date().toISOString(),
		},
		{
			id: "post-2",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2Ff40a525c-3a6e-49f6-9864-17ba873f3cee-demo-1.png",
			imageId: null,
			title: "My Daily AI Workflow",
			tier: "subscribers" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 3600000).toISOString(),
		},
		{
			id: "post-3",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2Fa42bd5b6-c6af-459b-b953-7ec287adeb25-demo-2.png",
			imageId: null,
			title: "BDS Deal: Metro Q2 Analysis",
			tier: "ppv" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 7200000).toISOString(),
		},
		{
			id: "post-4",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2Fcfe14393-3405-467f-a86e-62d65c546a01-demo-3.png",
			imageId: null,
			title: "Top 5 Productivity Hacks",
			tier: "public" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 10800000).toISOString(),
		},
		{
			id: "post-5",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: null,
			imageId: null,
			title: "Premium: Wealth Mindset 101",
			tier: "subscribers" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 14400000).toISOString(),
		},
		{
			id: "post-6",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: null,
			imageId: null,
			title: "Behind The Scenes: Photo Shoot",
			tier: "ppv" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 18000000).toISOString(),
		},
		{
			id: "post-7",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: null,
			imageId: null,
			title: "How I Grew to 1K Followers",
			tier: "public" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 21600000).toISOString(),
		},
		{
			id: "post-8",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			creatorAvatarUrl: null,
			thumbnailUrl: null,
			imageId: null,
			title: "Monthly AMA: June 2026",
			tier: "subscribers" as const,
			subscriberCount: 42,
			isNew: false,
			createdAt: new Date(Date.now() - 25200000).toISOString(),
		},
	]

	return c.json({ items, hasMore: false })
})

// GET /api/v1/stories — active stories for demo
app.get("/api/v1/stories", async (c) => {
	const stories = [
		{
			id: "story-1",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			avatarUrl: null,
			imageId: null,
			imageUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2F41292c0b-163d-4d9b-b47b-699d7856aa60-demo-0.png",
			tier: "public" as const,
			seen: false,
			live: true,
		},
		{
			id: "story-2",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			avatarUrl: null,
			imageId: null,
			imageUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2Ff40a525c-3a6e-49f6-9864-17ba873f3cee-demo-1.png",
			tier: "subscribers" as const,
			seen: true,
			live: false,
		},
		{
			id: "story-3",
			creatorId: "admin@onyx.com.vn",
			creatorName: "Admin Creator",
			avatarUrl: null,
			imageId: null,
			imageUrl: "https://box.onyx.com.vn/api/v1/media/r2/media%2Fadmin%40onyx.com.vn%2Fa42bd5b6-c6af-459b-b953-7ec287adeb25-demo-2.png",
			tier: "ppv" as const,
			seen: false,
			live: false,
		},
	]

	return c.json({ stories })
})
