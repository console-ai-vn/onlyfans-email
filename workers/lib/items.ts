export enum ItemType {
	Key = "key",
	Token = "token",
	Gift = "gift",
	Pass = "pass",
}

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
	[ItemType.Key]: "Key",
	[ItemType.Token]: "Token",
	[ItemType.Gift]: "Gift",
	[ItemType.Pass]: "Pass",
}

export const ITEM_PRICE_RANGE: Record<ItemType, { min: number; max: number }> = {
	[ItemType.Key]: { min: 0, max: 500000 },
	[ItemType.Token]: { min: 0, max: 1000000 },
	[ItemType.Gift]: { min: 0, max: 5000000 },
	[ItemType.Pass]: { min: 0, max: 20000000 },
}

const ALLOWED_TYPES = Object.values(ItemType) as string[]

export interface ItemDetails {
	type: ItemType
	name: string
	description: string
	price: number
	imageUrl: string
}

export interface ValidateResult {
	ok: boolean
	error?: string
}

export function validateItemDetails(params: {
	type: string
	name: string
	description: string
	price: number
	imageUrl: string
}): ValidateResult {
	if (!ALLOWED_TYPES.includes(params.type)) {
		return { ok: false, error: `Invalid item type: ${params.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` }
	}
	if (!params.name || params.name.trim().length === 0) {
		return { ok: false, error: "Item name is required" }
	}
	if (params.name.length > 200) {
		return { ok: false, error: "Item name must be 200 characters or less" }
	}
	if (!params.description || params.description.trim().length === 0) {
		return { ok: false, error: "Item description is required" }
	}
	if (params.description.length > 2000) {
		return { ok: false, error: "Item description must be 2000 characters or less" }
	}
	const range = ITEM_PRICE_RANGE[params.type as ItemType]
	if (typeof params.price !== "number" || isNaN(params.price) || params.price < 0) {
		return { ok: false, error: "Price must be a non-negative number" }
	}
	if (params.price > range.max) {
		return { ok: false, error: `Price for ${params.type} must be at most ${range.max.toLocaleString("vi-VN")} VND` }
	}
	if (params.imageUrl && params.imageUrl.length > 2048) {
		return { ok: false, error: "Image URL must be 2048 characters or less" }
	}

	return { ok: true }
}

export function formatItemType(type: ItemType): string {
	return ITEM_TYPE_LABELS[type] ?? type
}

export function formatVnd(amount: number): string {
	return new Intl.NumberFormat("vi-VN", {
		style: "currency",
		currency: "VND",
		maximumFractionDigits: 0,
	}).format(amount)
}
