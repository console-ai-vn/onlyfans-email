import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "~/services/api"
import { queryKeys } from "./keys"

// -- New creator-specific query keys (to be merged centrally later) --
const creatorKeys = {
	profile: (creatorId: string) => ["creator", "profile", creatorId] as const,
	content: (creatorId: string, page: number) => ["creator", "content", creatorId, page] as const,
	shop: (creatorId: string) => ["creator", "shop", creatorId] as const,
	top: ["creator", "top"] as const,
}

// ----------------------------------------------------------------
// Public creator profile
// ----------------------------------------------------------------
export interface CreatorProfile {
	id: string
	name: string
	bio?: string | null
	avatarUrl?: string | null
	coverUrl?: string | null
	avatarVersion?: string | null
	coverVersion?: string | null
	subscriberCount: number
	postCount: number
	itemCount: number
	website?: string | null
	location?: string | null
	subscriptionTier?: string | null
	keyPrice?: number
}

export interface CreatorContentItem {
	id: string
	thumbnailUrl?: string | null
	title: string
	tier: "public" | "subscribers" | "ppv"
	isUnlocked: boolean
	keyPrice?: number
	previewUrl?: string
	createdAt: string
	body?: string | null
}

export interface CreatorShopItem {
	id: string
	type: string
	name: string
	description: string
	price: number
	imageUrl: string | null
	active: boolean
	createdAt: string
}

export function useCreatorProfile(creatorId: string) {
	return useQuery({
		queryKey: creatorKeys.profile(creatorId),
		queryFn: () =>
			fetch(`/api/v1/creator/${encodeURIComponent(creatorId)}`).then((r) => {
				if (!r.ok) throw new Error("Creator not found")
				return r.json() as Promise<CreatorProfile>
			}),
		enabled: !!creatorId,
		staleTime: 60_000,
	})
}

export function useCreatorContent(creatorId: string, page: number) {
	return useQuery({
		queryKey: creatorKeys.content(creatorId, page),
		queryFn: () =>
			fetch(
				`/api/v1/creator/${encodeURIComponent(creatorId)}/content?page=${page}&limit=20`,
			).then((r) => {
				if (!r.ok) throw new Error("Failed to load content")
				return r.json() as Promise<{
					items: CreatorContentItem[]
					totalCount: number
					page: number
					limit: number
				}>
			}),
		enabled: !!creatorId,
		staleTime: 30_000,
	})
}

export function useCreatorShop(creatorId: string) {
	return useQuery({
		queryKey: creatorKeys.shop(creatorId),
		queryFn: () =>
			api.getCatalog(creatorId).then((res) =>
				(res.items || []).map(
					(item): CreatorShopItem => ({
						id: item.id,
						type: item.type,
						name: item.name,
						description: item.description,
						price: item.price,
						imageUrl: item.imageUrl,
						active: item.active !== false,
						createdAt: item.createdAt,
					}),
				),
			),
		enabled: !!creatorId,
		staleTime: 60_000,
	})
}

export function useTopCreators() {
	return useQuery({
		queryKey: creatorKeys.top,
		queryFn: () =>
			fetch("/api/v1/creator/top").then((r) => {
				if (!r.ok) throw new Error("Failed to load top creators")
				return r.json() as Promise<CreatorProfile[]>
			}),
		staleTime: 120_000,
	})
}

export function useUpdateCreatorProfile() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (settings: Record<string, unknown>) =>
			fetch("/api/v1/mailboxes/me", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ settings }),
			}).then((r) => {
				if (!r.ok) throw new Error("Failed to update profile")
				return r.json()
			}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["creator"] })
		},
	})
}
