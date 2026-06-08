import assert from "node:assert/strict";
import test from "node:test";
import {
	getRetentionCutoffs,
	normalizeRetentionPolicyOptions,
	RETENTION_BATCH_SIZE,
	RETENTION_ALARM_MS,
	SENT_ARCHIVE_DAYS,
	TRASH_RETENTION_DAYS,
} from "../workers/lib/retention.ts";

test("getRetentionCutoffs uses 30 day trash and 365 day sent windows", () => {
	const now = Date.parse("2026-06-08T12:00:00.000Z");
	const cutoffs = getRetentionCutoffs(now);

	assert.equal(
		cutoffs.trashCutoff,
		new Date(now - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
	);
	assert.equal(
		cutoffs.sentCutoff,
		new Date(now - SENT_ARCHIVE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
	);
});

test("retention constants stay within DO alarm limits", () => {
	assert.equal(RETENTION_BATCH_SIZE, 500);
	assert.equal(RETENTION_ALARM_MS, 24 * 60 * 60 * 1000);
});

test("normalizeRetentionPolicyOptions allows admin test override for trash", () => {
	assert.deepEqual(normalizeRetentionPolicyOptions({ trashDays: 0 }), {
		trashDays: 0,
		sentDays: SENT_ARCHIVE_DAYS,
	});
});

test("normalizeRetentionPolicyOptions rejects out-of-range test values", () => {
	assert.throws(() => normalizeRetentionPolicyOptions({ trashDays: 31 }), /trashDays/i);
});