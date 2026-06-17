import assert from "node:assert/strict";
import test from "node:test";
import {
	assertAuditAdminAccess,
	normalizeAuditListOptions,
} from "../workers/lib/audit.ts";
import { mailboxMigrations } from "../workers/durableObject/migrations.ts";

test("normalizeAuditListOptions clamps page and limit", () => {
	assert.deepEqual(
		normalizeAuditListOptions({ page: 0, limit: 500 }),
		{
			page: 1,
			limit: 100,
			offset: 0,
			action: undefined,
			actor: undefined,
			from: undefined,
			to: undefined,
		},
	);
});

test("assertAuditAdminAccess allows configured privileged users", () => {
	assert.doesNotThrow(() =>
		assertAuditAdminAccess("ceo@bdsmetro.com", ["ceo@bdsmetro.com"]),
	);
});

test("assertAuditAdminAccess rejects non-admin users", () => {
	assert.throws(
		() => assertAuditAdminAccess("admin@onyx.com.vn", ["ceo@bdsmetro.com"]),
		/admin access/i,
	);
});

test("mailbox migrations include audit log table", () => {
	const migration = mailboxMigrations.find((item) => item.name === "14_add_audit_log");

	assert.ok(migration);
	assert.match(migration.sql, /CREATE TABLE IF NOT EXISTS audit_log/i);
	assert.match(migration.sql, /actor_email TEXT NOT NULL/i);
	assert.match(migration.sql, /idx_audit_log_created_at/i);
});