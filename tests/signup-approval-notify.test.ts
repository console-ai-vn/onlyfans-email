import assert from "node:assert/strict";
import test from "node:test";
import { buildSignupApprovalEmail } from "../workers/lib/signup-approval-email-content.ts";

test("buildSignupApprovalEmail tells user to login with mailbox not personal email", () => {
	const { subject, text, html } = buildSignupApprovalEmail({
		id: "1",
		status: "approved",
		createdAt: "2026-06-08T00:00:00.000Z",
		displayName: "Zet",
		personalEmail: "user@gmail.com",
		desiredMailbox: "zet@vsbg.vn",
		note: "",
		storageKey: "signup-requests/x.json",
	});
	assert.match(subject, /zet@vsbg.vn/);
	assert.match(text, /zet@vsbg.vn/);
	assert.match(text, /không dùng user@gmail.com/i);
	assert.match(text, /OTP tại mailbox nội bộ/i);
	assert.match(html, /Đăng nhập bằng <strong>zet@vsbg\.vn<\/strong>/);
	assert.match(html, /không dùng để đăng nhập/);
});