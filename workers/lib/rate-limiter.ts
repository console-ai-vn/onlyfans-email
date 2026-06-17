// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * In-memory sliding-window rate limiter.
 * Resets on worker restart — acceptable per architecture plan.
 */

interface RateLimitEntry {
	count: number;
	resetAt: number; // epoch ms
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup: purge expired entries every 60 seconds
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
	if (cleanupTimer) return;
	cleanupTimer = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now >= entry.resetAt) {
				store.delete(key);
			}
		}
		// Shrink if the map is large and mostly expired
		if (store.size > 10_000) {
			for (const [key, entry] of store) {
				if (now >= entry.resetAt) store.delete(key);
			}
		}
	}, 60_000);

	// Allow Node.js to exit (unref only works in Node, safe no-op in workers)
	if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
		(cleanupTimer as unknown as { unref(): void }).unref();
	}
}

/**
 * Checks whether a request identified by `key` is allowed under the rate limit.
 *
 * @param key - Unique identifier (e.g. IP address, mailbox ID, endpoint path)
 * @param maxRequests - Maximum number of requests allowed within the window
 * @param windowMs - Sliding window duration in milliseconds
 * @returns `{ allowed: boolean }` plus `retryAfter` seconds if rate-limited
 */
export function checkRateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): { allowed: boolean; retryAfter?: number } {
	ensureCleanup();

	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now >= entry.resetAt) {
		// First request or window expired — reset
		store.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true };
	}

	if (entry.count >= maxRequests) {
		const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
		return { allowed: false, retryAfter };
	}

	entry.count++;
	return { allowed: true };
}

/**
 * Creates a rate-limiting middleware factory for a specific endpoint configuration.
 */
export function createRateLimiter(configs: Array<{
	path: string;
	method: string;
	maxRequests: number;
	windowMs: number;
}>) {
	return async (
		request: Request,
		next: () => Promise<Response> | Response,
	): Promise<Response> => {
		const url = new URL(request.url);
		const method = request.method.toUpperCase();

		const match = configs.find((c) => {
			if (c.method !== method) return false;

			// Support path pattern matching with :param placeholders
			const configParts = c.path.split("/");
			const urlParts = url.pathname.split("/");

			if (configParts.length !== urlParts.length) return false;

			for (let i = 0; i < configParts.length; i++) {
				if (configParts[i].startsWith(":")) continue; // param — always matches
				if (configParts[i] !== urlParts[i]) return false;
			}
			return true;
		});

		if (!match) return next();

		// Use client IP or a composite key
		const clientIp =
			request.headers.get("cf-connecting-ip") ||
			request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			"unknown";
		const rateKey = `${clientIp}:${match.path}:${method}`;

		const result = checkRateLimit(rateKey, match.maxRequests, match.windowMs);

		if (!result.allowed) {
			return new Response(
				JSON.stringify({
					error: "Too many requests. Please try again later.",
					retryAfter: result.retryAfter,
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": String(result.retryAfter ?? 60),
					},
				},
			);
		}

		return next();
	};
}
