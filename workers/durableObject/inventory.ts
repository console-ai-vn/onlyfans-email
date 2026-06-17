import { DurableObject } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/durable-sqlite"
import type { Env } from "../types"
import { applyMigrations } from "./migrations"
import { inventoryMigrations } from "./inventoryMigrations"
import type { ItemType } from "../lib/items"

export interface CatalogItem {
	id: string
	creatorMailboxId: string
	type: ItemType
	name: string
	description: string
	price: number
	imageUrl: string | null
	active: boolean
	createdAt: string
	updatedAt: string
}

export interface InventoryEntry {
	id: string
	userEmail: string
	itemId: string
	status: "active" | "consumed" | "expired"
	purchaseId: string | null
	grantedAt: string
	expiresAt: string | null
	consumedAt: string | null
}

export interface ConsumptionLogEntry {
	id: string
	userEmail: string
	itemId: string
	resourceType: string | null
	resourceId: string | null
	consumedAt: string
}

const ALARM_INTERVAL_MS = 60 * 60 * 1000 // hourly

export class InventoryDO extends DurableObject<Env> {
	declare __DURABLE_OBJECT_BRAND: never
	db: ReturnType<typeof drizzle>

	constructor(state: DurableObjectState, env: Env) {
		super(state, env)
		this.db = drizzle(this.ctx.storage)
		applyMigrations(this.ctx.storage.sql, inventoryMigrations, this.ctx.storage)
		this.ctx.blockConcurrencyWhile(async () => {
			const alarm = await this.ctx.storage.getAlarm()
			if (alarm === null) {
				await this.ctx.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
			}
		})
	}

	async alarm() {
		try {
			await this.expireItems()
		} catch (error) {
			console.error("inventory alarm failed", error)
		} finally {
			await this.ctx.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS)
		}
	}

	async createCatalogItem(params: {
		creatorMailboxId: string
		type: ItemType
		name: string
		description: string
		price: number
		imageUrl: string
	}): Promise<CatalogItem> {
		const now = new Date().toISOString()
		const id = crypto.randomUUID()

		this.ctx.storage.sql.exec(
			`INSERT INTO catalog (id, creator_mailbox_id, type, name, description, price, image_url, active, created_at, updated_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, ?8)`,
			id,
			params.creatorMailboxId,
			params.type,
			params.name.trim(),
			params.description.trim(),
			params.price,
			params.imageUrl || null,
			now,
		)

		return this.mapCatalogRow(this.getCatalogRowById(id)!)
	}

	async updateCatalogItem(
		itemId: string,
		params: {
			type?: string
			name?: string
			description?: string
			price?: number
			imageUrl?: string
		},
	): Promise<CatalogItem | null> {
		const existing = this.getCatalogRowById(itemId)
		if (!existing) return null

		const now = new Date().toISOString()

		if (params.type !== undefined) {
			this.ctx.storage.sql.exec(
				`UPDATE catalog SET type = ?1, updated_at = ?2 WHERE id = ?3`,
				params.type, now, itemId,
			)
		}
		if (params.name !== undefined) {
			this.ctx.storage.sql.exec(
				`UPDATE catalog SET name = ?1, updated_at = ?2 WHERE id = ?3`,
				params.name.trim(), now, itemId,
			)
		}
		if (params.description !== undefined) {
			this.ctx.storage.sql.exec(
				`UPDATE catalog SET description = ?1, updated_at = ?2 WHERE id = ?3`,
				params.description.trim(), now, itemId,
			)
		}
		if (params.price !== undefined) {
			this.ctx.storage.sql.exec(
				`UPDATE catalog SET price = ?1, updated_at = ?2 WHERE id = ?3`,
				params.price, now, itemId,
			)
		}
		if (params.imageUrl !== undefined) {
			this.ctx.storage.sql.exec(
				`UPDATE catalog SET image_url = ?1, updated_at = ?2 WHERE id = ?3`,
				params.imageUrl || null, now, itemId,
			)
		}

		return this.mapCatalogRow(this.getCatalogRowById(itemId)!)
	}

	async deactivateCatalogItem(itemId: string): Promise<void> {
		const now = new Date().toISOString()
		this.ctx.storage.sql.exec(
			`UPDATE catalog SET active = 0, updated_at = ?1 WHERE id = ?2`,
			now, itemId,
		)
	}

	async grantItem(params: {
		userEmail: string
		itemId: string
		purchaseId: string | null
		expiresAt?: string
	}): Promise<InventoryEntry> {
		const now = new Date().toISOString()
		const id = crypto.randomUUID()

		this.ctx.storage.sql.exec(
			`INSERT INTO user_inventories (id, user_email, item_id, status, purchase_id, granted_at, expires_at)
			 VALUES (?1, ?2, ?3, 'active', ?4, ?5, ?6)`,
			id,
			params.userEmail.toLowerCase().trim(),
			params.itemId,
			params.purchaseId || null,
			now,
			params.expiresAt || null,
		)

		return this.mapInventoryRow(this.getInventoryRowById(id)!)
	}

	async consumeItem(params: {
		userEmail: string
		itemId: string
		resourceType: string
		resourceId: string
	}): Promise<{ success: boolean }> {
		const normalizedEmail = params.userEmail.toLowerCase().trim()
		const now = new Date().toISOString()

		// Find an active, unexpired inventory entry for this user + item
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT id FROM user_inventories
				 WHERE user_email = ?1 AND item_id = ?2 AND status = 'active'
				   AND (expires_at IS NULL OR expires_at > ?3)
				 ORDER BY granted_at ASC LIMIT 1`,
				normalizedEmail, params.itemId, now,
			),
		] as Array<{ id: string }>

		if (rows.length === 0) {
			return { success: false }
		}

		const inventoryId = rows[0].id

		// Mark as consumed
		this.ctx.storage.sql.exec(
			`UPDATE user_inventories SET status = 'consumed', consumed_at = ?1 WHERE id = ?2`,
			now, inventoryId,
		)

		// Log consumption
		const logId = crypto.randomUUID()
		this.ctx.storage.sql.exec(
			`INSERT INTO consumption_log (id, user_email, item_id, resource_type, resource_id, consumed_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
			logId, normalizedEmail, params.itemId, params.resourceType, params.resourceId, now,
		)

		return { success: true }
	}

	async getUserItems(
		userEmail: string,
		type?: string,
		status?: string,
	): Promise<Array<InventoryEntry & { item_name?: string; item_type?: string }>> {
		const normalizedEmail = userEmail.toLowerCase().trim()
		const conditions: string[] = ["ui.user_email = ?1"]
		const params: unknown[] = [normalizedEmail]
		let paramIdx = 1

		if (type) {
			paramIdx++
			conditions.push(`c.type = ?${paramIdx}`)
			params.push(type)
		}
		if (status) {
			paramIdx++
			conditions.push(`ui.status = ?${paramIdx}`)
			params.push(status)
		}

		const where = conditions.join(" AND ")
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT ui.id, ui.user_email, ui.item_id, ui.status, ui.purchase_id,
				        ui.granted_at, ui.expires_at, ui.consumed_at,
				        c.name as item_name, c.type as item_type
				 FROM user_inventories ui
				 LEFT JOIN catalog c ON c.id = ui.item_id
				 WHERE ${where}
				 ORDER BY ui.granted_at DESC`,
				...params,
			),
		] as Array<{
			id: string; user_email: string; item_id: string; status: string
			purchase_id: string | null; granted_at: string; expires_at: string | null
			consumed_at: string | null; item_name?: string; item_type?: string
		}>

		return rows.map((row) => ({
			id: row.id,
			userEmail: row.user_email,
			itemId: row.item_id,
			status: row.status as "active" | "consumed" | "expired",
			purchaseId: row.purchase_id,
			grantedAt: row.granted_at,
			expiresAt: row.expires_at,
			consumedAt: row.consumed_at,
			item_name: row.item_name,
			item_type: row.item_type,
		}))
	}

	async getCatalogItems(creatorMailboxId?: string): Promise<CatalogItem[]> {
		let rows: Array<{
			id: string; creator_mailbox_id: string; type: string; name: string
			description: string; price: number; image_url: string | null
			active: number; created_at: string; updated_at: string
		}>

		if (creatorMailboxId) {
			rows = [
				...this.ctx.storage.sql.exec(
					`SELECT * FROM catalog
					 WHERE creator_mailbox_id = ?1 AND active = 1
					 ORDER BY created_at DESC`,
					creatorMailboxId,
				),
			] as typeof rows
		} else {
			rows = [
				...this.ctx.storage.sql.exec(
					`SELECT * FROM catalog
					 WHERE active = 1
					 ORDER BY created_at DESC`,
				),
			] as typeof rows
		}

		return rows.map((row) => this.mapCatalogRow(row))
	}

	async getPurchaseHistory(userEmail: string): Promise<InventoryEntry[]> {
		const normalizedEmail = userEmail.toLowerCase().trim()
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT * FROM user_inventories
				 WHERE user_email = ?1
				 ORDER BY granted_at DESC`,
				normalizedEmail,
			),
		] as Array<{
			id: string; user_email: string; item_id: string; status: string
			purchase_id: string | null; granted_at: string; expires_at: string | null
			consumed_at: string | null
		}>

		return rows.map((row) => this.mapInventoryRow(row))
	}

	// Private helpers

	private async expireItems(): Promise<void> {
		const now = new Date().toISOString()
		this.ctx.storage.sql.exec(
			`UPDATE user_inventories
			 SET status = 'expired', consumed_at = ?1
			 WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= ?1`,
			now,
		)
	}

	private getCatalogRowById(id: string) {
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT * FROM catalog WHERE id = ?1`, id,
			),
		] as Array<{
			id: string; creator_mailbox_id: string; type: string; name: string
			description: string; price: number; image_url: string | null
			active: number; created_at: string; updated_at: string
		}>
		return rows[0] ?? null
	}

	private getInventoryRowById(id: string) {
		const rows = [
			...this.ctx.storage.sql.exec(
				`SELECT * FROM user_inventories WHERE id = ?1`, id,
			),
		] as Array<{
			id: string; user_email: string; item_id: string; status: string
			purchase_id: string | null; granted_at: string; expires_at: string | null
			consumed_at: string | null
		}>
		return rows[0] ?? null
	}

	private mapCatalogRow(row: {
		id: string; creator_mailbox_id: string; type: string; name: string
		description: string; price: number; image_url: string | null
		active: number; created_at: string; updated_at: string
	}): CatalogItem {
		return {
			id: row.id,
			creatorMailboxId: row.creator_mailbox_id,
			type: row.type as ItemType,
			name: row.name,
			description: row.description,
			price: row.price,
			imageUrl: row.image_url,
			active: row.active === 1,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}
	}

	private mapInventoryRow(row: {
		id: string; user_email: string; item_id: string; status: string
		purchase_id: string | null; granted_at: string; expires_at: string | null
		consumed_at: string | null
	}): InventoryEntry {
		return {
			id: row.id,
			userEmail: row.user_email,
			itemId: row.item_id,
			status: row.status as "active" | "consumed" | "expired",
			purchaseId: row.purchase_id,
			grantedAt: row.granted_at,
			expiresAt: row.expires_at,
			consumedAt: row.consumed_at,
		}
	}
}
