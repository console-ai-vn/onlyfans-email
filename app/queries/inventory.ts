import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "~/services/api"
import { queryKeys } from "./keys"

// ── Catalog ────────────────────────────────────────────────

export function useCatalog(creatorMailboxId?: string) {
	return useQuery({
		queryKey: queryKeys.inventory.catalog(creatorMailboxId),
		queryFn: () => api.getCatalog(creatorMailboxId),
	})
}

// ── Mutations ──────────────────────────────────────────────

export function useCreateItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: {
			creatorMailboxId: string
			type: string
			name: string
			description: string
			price: number
			imageUrl?: string
		}) => api.createCatalogItem(params),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["inventory", "catalog"] })
		},
	})
}

export function useUpdateItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: {
			itemId: string
			type?: string
			name?: string
			description?: string
			price?: number
			imageUrl?: string
		}) => api.updateCatalogItem(params.itemId, {
			type: params.type,
			name: params.name,
			description: params.description,
			price: params.price,
			imageUrl: params.imageUrl,
		}),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["inventory", "catalog"] })
		},
	})
}

export function usePurchaseItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: { userEmail: string; itemId: string }) =>
			api.purchaseItem(params),
		onSuccess: (_data, { userEmail }) => {
			qc.invalidateQueries({ queryKey: queryKeys.inventory.userItems(userEmail) })
		},
	})
}

// ── User Items ─────────────────────────────────────────────

export function useUserItems(userEmail: string) {
	return useQuery({
		queryKey: userEmail
			? queryKeys.inventory.userItems(userEmail)
			: ["inventory", "items", "_disabled"],
		queryFn: () => api.getUserItems(userEmail),
		enabled: !!userEmail,
	})
}

export function useConsumeItem() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (params: {
			userEmail: string
			itemId: string
			resourceType: string
			resourceId: string
		}) => api.consumeItem(params),
		onSuccess: (_data, { userEmail }) => {
			qc.invalidateQueries({ queryKey: queryKeys.inventory.userItems(userEmail) })
			qc.invalidateQueries({ queryKey: queryKeys.inventory.history(userEmail) })
		},
	})
}

// ── History ────────────────────────────────────────────────

export function usePurchaseHistory(userEmail: string) {
	return useQuery({
		queryKey: userEmail
			? queryKeys.inventory.history(userEmail)
			: ["inventory", "history", "_disabled"],
		queryFn: () => api.getPurchaseHistory(userEmail),
		enabled: !!userEmail,
	})
}
