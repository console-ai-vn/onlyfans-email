// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Applies security-related HTTP headers to a Response.
 * Intended for all non-public API responses.
 */
export function applySecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);

	// Force HTTPS for 1 year, including subdomains
	if (!headers.has("Strict-Transport-Security")) {
		headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains",
		);
	}

	// Prevent clickjacking
	if (!headers.has("X-Frame-Options")) {
		headers.set("X-Frame-Options", "DENY");
	}

	// Prevent MIME sniffing
	if (!headers.has("X-Content-Type-Options")) {
		headers.set("X-Content-Type-Options", "nosniff");
	}

	// Limit referrer info on cross-origin requests
	if (!headers.has("Referrer-Policy")) {
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	}

	// Restrict browser features (camera, mic, geolocation)
	if (!headers.has("Permissions-Policy")) {
		headers.set(
			"Permissions-Policy",
			"camera=(), microphone=(), geolocation=()",
		);
	}

	// Prevent cross-origin opener access
	if (!headers.has("Cross-Origin-Opener-Policy")) {
		headers.set("Cross-Origin-Opener-Policy", "same-origin");
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/**
 * Applies Content-Security-Policy headers compatible with:
 * - Cloudflare Stream (HLS via videodelivery.net, cloudflarestream.com)
 * - Cloudflare Images CDN (imagedelivery.net)
 * - Cloudflare Turnstile (challenge.cloudflare.com)
 * - Cloudflare Web Analytics (static.cloudflareinsights.com)
 */
export function applyCspHeaders(response: Response): Response {
	const headers = new Headers(response.headers);

	const csp = [
		"default-src 'self'",
		// Scripts: self, inline for React hydration, Turnstile, CF analytics
		"script-src 'self' 'unsafe-inline' challenge.cloudflare.com static.cloudflareinsights.com",
		// Styles: self, inline for CSS-in-JS
		"style-src 'self' 'unsafe-inline'",
		// Images: self, data URIs, blobs, CF Images CDN, any HTTPS (for email content)
		"img-src 'self' data: blob: imagedelivery.net https:",
		// Media: self, CF Stream domains
		"media-src 'self' videodelivery.net cloudflarestream.com",
		// Connect: self, CF Stream, Turnstile
		"connect-src 'self' videodelivery.net cloudflarestream.com challenge.cloudflare.com",
		// Fonts: self, data URIs
		"font-src 'self' data:",
		// Frames: Turnstile only (explicit widget)
		"frame-src challenge.cloudflare.com",
		// No frames from other origins embedding us
		"frame-ancestors 'none'",
		// No plugins
		"object-src 'none'",
		// Restrict base URI
		"base-uri 'self'",
		// Restrict form submissions
		"form-action 'self'",
	].join("; ");

	headers.set("Content-Security-Policy", csp);

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}
