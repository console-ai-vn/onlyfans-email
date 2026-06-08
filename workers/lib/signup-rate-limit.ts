import type { Env } from "../types";

const SIGNUP_RATE_LIMIT_PER_HOUR = 5;

function hourBucketKey() {
	return new Date().toISOString().slice(0, 13);
}

export async function assertSignupRateLimit(env: Env, ip: string) {
	const normalizedIp = ip.trim() || "unknown";
	const key = `signup-rate-limit/${normalizedIp}/${hourBucketKey()}`;
	const existing = await env.BUCKET.get(key);
	const count = existing ? Number.parseInt(await existing.text(), 10) : 0;
	if (Number.isFinite(count) && count >= SIGNUP_RATE_LIMIT_PER_HOUR) {
		throw new Error("Too many signup requests. Try again later.");
	}
	await env.BUCKET.put(key, String((Number.isFinite(count) ? count : 0) + 1), {
		httpMetadata: { contentType: "text/plain" },
	});
}