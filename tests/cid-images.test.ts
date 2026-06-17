import assert from "node:assert/strict";
import test from "node:test";
import { rewriteCidImages } from "../shared/cid-images.ts";

test("rewriteCidImages maps cid references to attachment URLs", () => {
	const html = '<p>Hello<img src="cid:image-1@example.com"></p>';
	const result = rewriteCidImages(html, "admin@onyx.com.vn", "email-1", [
		{ id: "att-1", content_id: "<image-1@example.com>", disposition: "inline" },
	]);
	assert.match(
		result,
		/src="\/api\/v1\/mailboxes\/admin@onyx.com.vn\/emails\/email-1\/attachments\/att-1"/,
	);
	assert.doesNotMatch(result, /Image unavailable/);
});

test("rewriteCidImages handles encoded cid values", () => {
	const html = '<img src="cid:image%201@example.com">';
	const result = rewriteCidImages(html, "admin@onyx.com.vn", "email-2", [
		{ id: "att-2", content_id: "image 1@example.com", disposition: "inline" },
	]);
	assert.match(result, /attachments\/att-2/);
});

test("rewriteCidImages replaces unmatched cid images with a clear fallback", () => {
	const html = '<p>Photo<img src="cid:missing-image" data-name="photo.jpg"></p>';
	const result = rewriteCidImages(html, "admin@onyx.com.vn", "email-3", []);
	assert.doesNotMatch(result, /src="cid:/);
	assert.match(result, /Image unavailable: photo\.jpg was not included/);
});
