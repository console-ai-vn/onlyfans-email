import assert from "node:assert/strict";
import test from "node:test";
import {
	assertAttachmentBelongsToEmail,
	assertAllowedImageAttachments,
	isAllowedInboundImageAttachment,
} from "../workers/lib/attachments.ts";

test("assertAttachmentBelongsToEmail accepts matching message metadata", () => {
	assert.doesNotThrow(() =>
		assertAttachmentBelongsToEmail({ email_id: "message-1" }, "message-1"),
	);
});

test("assertAttachmentBelongsToEmail rejects a mismatched message URL", () => {
	assert.throws(
		() => assertAttachmentBelongsToEmail({ email_id: "message-1" }, "message-2"),
		/attachment/i,
	);
});

test("assertAllowedImageAttachments accepts JPEG PNG and WebP files", () => {
	assert.doesNotThrow(() =>
		assertAllowedImageAttachments([
			{ type: "image/jpeg", size: 1024 },
			{ type: "image/png", size: 2048 },
			{ type: "image/webp", size: 4096 },
		]),
	);
});

test("assertAllowedImageAttachments rejects SVG active content", () => {
	assert.throws(
		() => assertAllowedImageAttachments([{ type: "image/svg+xml", size: 1024 }]),
		/JPEG, PNG, and WebP/i,
	);
});

test("assertAllowedImageAttachments rejects images over 10MB", () => {
	assert.throws(
		() =>
			assertAllowedImageAttachments([
				{ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 },
			]),
		/10MB/i,
	);
});

test("assertAllowedImageAttachments rejects messages over 25MB", () => {
	assert.throws(
		() =>
			assertAllowedImageAttachments([
				{ type: "image/jpeg", size: 9 * 1024 * 1024 },
				{ type: "image/png", size: 9 * 1024 * 1024 },
				{ type: "image/webp", size: 8 * 1024 * 1024 },
			]),
		/25MB/i,
	);
});

test("isAllowedInboundImageAttachment keeps safe images", () => {
	assert.equal(
		isAllowedInboundImageAttachment({ type: "image/png", size: 2048 }),
		true,
	);
});

test("isAllowedInboundImageAttachment drops unsupported files without dropping email", () => {
	assert.equal(
		isAllowedInboundImageAttachment({ type: "application/pdf", size: 2048 }),
		false,
	);
});
