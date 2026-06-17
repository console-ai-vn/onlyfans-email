import type { Migration } from "./migrations"

export const inventoryMigrations: Migration[] = [
	{
		name: "1_initial_setup",
		sql: `
			CREATE TABLE IF NOT EXISTS catalog (
				id TEXT PRIMARY KEY,
				creator_mailbox_id TEXT NOT NULL,
				type TEXT NOT NULL,
				name TEXT NOT NULL,
				description TEXT NOT NULL,
				price INTEGER NOT NULL,
				image_url TEXT,
				active INTEGER NOT NULL DEFAULT 1,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS user_inventories (
				id TEXT PRIMARY KEY,
				user_email TEXT NOT NULL,
				item_id TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'active',
				purchase_id TEXT,
				granted_at TEXT NOT NULL,
				expires_at TEXT,
				consumed_at TEXT,
				FOREIGN KEY(item_id) REFERENCES catalog(id)
			);

			CREATE TABLE IF NOT EXISTS consumption_log (
				id TEXT PRIMARY KEY,
				user_email TEXT NOT NULL,
				item_id TEXT NOT NULL,
				resource_type TEXT,
				resource_id TEXT,
				consumed_at TEXT NOT NULL
			);

			CREATE INDEX IF NOT EXISTS idx_catalog_creator ON catalog(creator_mailbox_id);
			CREATE INDEX IF NOT EXISTS idx_catalog_active ON catalog(active);
			CREATE INDEX IF NOT EXISTS idx_catalog_type ON catalog(type);
			CREATE INDEX IF NOT EXISTS idx_user_inventories_user ON user_inventories(user_email);
			CREATE INDEX IF NOT EXISTS idx_user_inventories_user_item ON user_inventories(user_email, item_id);
			CREATE INDEX IF NOT EXISTS idx_user_inventories_status ON user_inventories(status);
			CREATE INDEX IF NOT EXISTS idx_consumption_log_user ON consumption_log(user_email);
			CREATE INDEX IF NOT EXISTS idx_consumption_log_consumed_at ON consumption_log(consumed_at);
		`,
	},
]
