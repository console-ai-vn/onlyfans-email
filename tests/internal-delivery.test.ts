import assert from "node:assert/strict";
import test from "node:test";
import { getRecipientRouting } from "../workers/lib/recipient-routing.ts";

const env = {
	EMAIL_ADDRESSES: ["admin@vsbg.vn", "test@vsbg.vn"],
};

test("getRecipientRouting detects all-internal delivery", () => {
	const routing = getRecipientRouting(env as any, { to: "TEST@VSBG.VN" });

	assert.deepEqual(routing.internalRecipients, ["test@vsbg.vn"]);
	assert.equal(routing.hasExternalRecipients, false);
});

test("getRecipientRouting dedupes internal recipients and flags external delivery", () => {
	const routing = getRecipientRouting(env as any, {
		to: ["test@vsbg.vn", "customer@gmail.com"],
		cc: "admin@vsbg.vn",
		bcc: "ADMIN@VSBG.VN",
	});

	assert.deepEqual(routing.internalRecipients, ["test@vsbg.vn", "admin@vsbg.vn"]);
	assert.equal(routing.hasExternalRecipients, true);
	assert.deepEqual(routing.externalRecipients, ["customer@gmail.com"]);
});
