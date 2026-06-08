import assert from "node:assert/strict";
import test from "node:test";
import {
	normalizeConversationStatePatch,
} from "../workers/lib/conversation-state.ts";
import { mailboxMigrations } from "../workers/durableObject/migrations.ts";

test("normalizeConversationStatePatch accepts compact mobile state updates", () => {
	assert.deepEqual(
		normalizeConversationStatePatch({
			status: "waiting",
			assignee_email: " Owner@Example.COM ",
			priority: "high",
			needs_reply: true,
		}),
		{
			status: "waiting",
			assignee_email: "owner@example.com",
			priority: "high",
			needs_reply: true,
		},
	);
});

test("normalizeConversationStatePatch rejects unknown statuses", () => {
	assert.throws(
		() => normalizeConversationStatePatch({ status: "lead" }),
		/status/i,
	);
});

test("mailbox migrations include conversation state table", () => {
	const migration = mailboxMigrations.find(
		(item) => item.name === "10_add_conversation_state",
	);

	assert.ok(migration);
	assert.match(migration.sql, /CREATE TABLE IF NOT EXISTS conversation_state/i);
	assert.match(migration.sql, /thread_id TEXT PRIMARY KEY/i);
	assert.match(migration.sql, /status TEXT NOT NULL DEFAULT 'open'/i);
});
