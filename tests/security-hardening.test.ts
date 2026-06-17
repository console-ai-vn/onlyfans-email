import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeRichHtml } from "../workers/lib/html-sanitize.ts";

const TOOL_ACCESS_EMAIL_HEADER = "x-onyx-access-email";

function parseAgentMailboxId(pathname: string): string | null {
	const match = pathname.match(/^\/agents\/[^/]+\/([^/]+)/);
	if (!match?.[1]) return null;
	try {
		return decodeURIComponent(match[1]).trim().toLowerCase();
	} catch {
		return match[1].trim().toLowerCase();
	}
}

function withToolAccessEmail(request: Request, accessEmail: string): Request {
	if (!accessEmail) return request;
	const headers = new Headers(request.headers);
	headers.set(TOOL_ACCESS_EMAIL_HEADER, accessEmail);
	return new Request(request, { headers });
}

function toPublicMailboxSettings(settings: Record<string, unknown> | undefined) {
	return {
		fromName: typeof settings?.fromName === "string" ? settings.fromName : undefined,
		bio: typeof settings?.bio === "string" ? settings.bio : undefined,
	};
}

test("sanitizeRichHtml strips scripts, handlers, and javascript urls", () => {
	const sanitized = sanitizeRichHtml(
		'<p onclick="alert(1)">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="/x"></iframe>',
	);
	assert.equal(sanitized.includes("<script"), false);
	assert.equal(sanitized.includes("onclick"), false);
	assert.equal(sanitized.includes("javascript:"), false);
	assert.equal(sanitized.includes("<iframe"), false);
	assert.match(sanitized, /Hi/);
});

test("toPublicMailboxSettings keeps only org-visible profile fields", () => {
	const settings = toPublicMailboxSettings({
		fromName: "Admin",
		bio: "Hello",
		agentSystemPrompt: "secret",
		forwarding: { enabled: true, email: "x@y.z" },
	});
	assert.equal(settings.fromName, "Admin");
	assert.equal(settings.bio, "Hello");
	assert.equal((settings as Record<string, unknown>).agentSystemPrompt, undefined);
});

test("parseAgentMailboxId extracts mailbox id from agent route", () => {
	assert.equal(
		parseAgentMailboxId("/agents/email-agent/owner%40onyx.com.vn"),
		"owner@onyx.com.vn",
	);
	assert.equal(parseAgentMailboxId("/api/v1/mailboxes/x"), null);
});

test("withToolAccessEmail forwards access identity header", () => {
	const request = withToolAccessEmail(
		new Request("https://box.onyx.com.vn/mcp"),
		"admin@onyx.com.vn",
	);
	assert.equal(
		request.headers.get(TOOL_ACCESS_EMAIL_HEADER),
		"admin@onyx.com.vn",
	);
});