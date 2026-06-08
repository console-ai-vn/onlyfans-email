import assert from "node:assert/strict";
import test from "node:test";
import {
	normalizeInternalNoteBody,
	normalizeConversationEventType,
} from "../workers/lib/internal-notes.ts";
import { mailboxMigrations } from "../workers/durableObject/migrations.ts";

test("normalizeInternalNoteBody trims notes and preserves meaningful line breaks", () => {
	assert.equal(
		normalizeInternalNoteBody("  Call after 3pm.\n\nAsk about budget.  "),
		"Call after 3pm.\n\nAsk about budget.",
	);
});

test("normalizeInternalNoteBody rejects empty notes", () => {
	assert.throws(() => normalizeInternalNoteBody("   "), /note/i);
});

test("normalizeConversationEventType rejects unknown event types", () => {
	assert.throws(() => normalizeConversationEventType("like"), /event/i);
});

test("mailbox migrations include internal notes and conversation events", () => {
	const migration = mailboxMigrations.find(
		(item) => item.name === "11_add_internal_notes_events",
	);

	assert.ok(migration);
	assert.match(migration.sql, /CREATE TABLE IF NOT EXISTS internal_notes/i);
	assert.match(migration.sql, /CREATE TABLE IF NOT EXISTS conversation_events/i);
	assert.match(migration.sql, /idx_internal_notes_thread/i);
	assert.match(migration.sql, /idx_conversation_events_thread/i);
});
