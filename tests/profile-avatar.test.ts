import assert from "node:assert/strict";
import test from "node:test";
import {
	decodeAvatarUpload,
	decodeCoverUpload,
	extractMailboxEmailFromSender,
	profileAvatarKey,
	profileCoverKey,
} from "../workers/lib/profile-avatar.ts";

test("profileAvatarKey normalizes mailbox id", () => {
	assert.equal(profileAvatarKey("User@VSBG.VN"), "profiles/user@vsbg.vn/avatar");
});

test("profileCoverKey normalizes mailbox id", () => {
	assert.equal(profileCoverKey("User@VSBG.VN"), "profiles/user@vsbg.vn/cover");
});

test("decodeAvatarUpload accepts small PNG payload", () => {
	const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const content = png.toString("base64");
	const result = decodeAvatarUpload({ content, type: "image/png" });
	assert.equal(result.contentType, "image/png");
	assert.equal(result.bytes.length, 8);
});

test("decodeCoverUpload accepts larger cover payload", () => {
	const jpeg = Buffer.alloc(3 * 1024 * 1024);
	jpeg[0] = 0xff;
	jpeg[1] = 0xd8;
	jpeg[2] = 0xff;
	const content = jpeg.toString("base64");
	const result = decodeCoverUpload({ content, type: "image/jpeg" });
	assert.equal(result.bytes.length, 3 * 1024 * 1024);
});

test("decodeCoverUpload rejects covers over 4MB", () => {
	const oversized = Buffer.alloc(4 * 1024 * 1024 + 1);
	oversized[0] = 0xff;
	oversized[1] = 0xd8;
	oversized[2] = 0xff;
	const content = oversized.toString("base64");
	assert.throws(
		() => decodeCoverUpload({ content, type: "image/jpeg" }),
		/4MB or smaller/i,
	);
});

test("decodeAvatarUpload rejects SVG", () => {
	assert.throws(
		() => decodeAvatarUpload({ content: "abc", type: "image/svg+xml" }),
		/JPEG, PNG, or WebP/i,
	);
});

test("extractMailboxEmailFromSender parses display name format", () => {
	assert.equal(
		extractMailboxEmailFromSender("Thai Hieu <hieu@vsbg.vn>"),
		"hieu@vsbg.vn",
	);
});