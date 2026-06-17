import assert from "node:assert/strict";
import test from "node:test";
import { getRecipientRouting } from "../workers/lib/recipient-routing.ts";

const env = {
	EMAIL_ADDRESSES: ["admin@onyx.com.vn", "test@onyx.com.vn"],
};

test("getRecipientRouting detects all-internal delivery", () => {
	const routing = getRecipientRouting(env as any, { to: "TEST@ONYX.COM.VN" });

	assert.deepEqual(routing.internalRecipients, ["test@onyx.com.vn"]);
	assert.equal(routing.hasExternalRecipients, false);
});

test("getRecipientRouting dedupes internal recipients and flags external delivery", () => {
	const routing = getRecipientRouting(env as any, {
		to: ["test@onyx.com.vn", "customer@gmail.com"],
		cc: "admin@onyx.com.vn",
		bcc: "ADMIN@ONYX.COM.VN",
	});

	assert.deepEqual(routing.internalRecipients, ["test@onyx.com.vn", "admin@onyx.com.vn"]);
	assert.equal(routing.hasExternalRecipients, true);
	assert.deepEqual(routing.externalRecipients, ["customer@gmail.com"]);
});
