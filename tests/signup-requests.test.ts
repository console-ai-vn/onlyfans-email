import assert from "node:assert/strict";
import test from "node:test";
import {
	buildApprovalNote,
	buildRejectionNote,
	defaultMailboxSettings,
	mergeMailboxAllowlist,
} from "../workers/lib/signup-request-utils.ts";

test("mergeMailboxAllowlist adds mailbox without duplicates", () => {
	const merged = mergeMailboxAllowlist(
		["admin@vsbg.vn", "TEST@vsbg.vn"],
		"nomad@vsbg.vn",
	);
	assert.deepEqual(merged, ["admin@vsbg.vn", "test@vsbg.vn", "nomad@vsbg.vn"]);
});

test("mergeMailboxAllowlist is idempotent for same mailbox", () => {
	const merged = mergeMailboxAllowlist(["nomad@vsbg.vn"], "NOMAD@vsbg.vn");
	assert.deepEqual(merged, ["nomad@vsbg.vn"]);
});

test("defaultMailboxSettings uses display name for fromName", () => {
	const settings = defaultMailboxSettings("Nguyen Thai Hieu");
	assert.equal(settings.fromName, "Nguyen Thai Hieu");
	assert.equal(settings.forwarding.enabled, false);
});

test("buildApprovalNote records automation outcome", () => {
	const note = buildApprovalNote(
		"ceo@bdsmetro.com",
		"nomad@vsbg.vn",
		"user@gmail.com",
		true,
	);
	assert.match(note, /nomad@vsbg.vn/);
	assert.match(note, /OTP allowlist updated automatically/);
});

test("buildRejectionNote records actor", () => {
	assert.match(buildRejectionNote("CEO@bdsmetro.com"), /Rejected by ceo@bdsmetro.com/);
});