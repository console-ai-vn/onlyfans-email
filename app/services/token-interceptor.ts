// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Token interceptor for API client.
 *
 * Attaches Authorization headers to requests, intercepts 401 responses,
 * attempts token refresh, and retries the original request.
 * If refresh fails, redirects to the login/signup page.
 */

const ACCESS_TOKEN_KEY = "onyx-access-token";
const REFRESH_TOKEN_KEY = "onyx-refresh-token";

let refreshPromise: Promise<string | null> | null = null;

/**
 * Retrieves the stored access token, if any.
 */
export function getAccessToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Retrieves the stored refresh token, if any.
 */
export function getRefreshToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Stores a token pair returned from the auth endpoint.
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
	localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clears all stored tokens (logout).
 */
export function clearTokens(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 * Deduplicates concurrent refresh attempts.
 */
async function attemptTokenRefresh(): Promise<string | null> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return null;

	// Deduplicate: if a refresh is already in-flight, wait for it
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const res = await fetch("/api/v1/auth/refresh", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken }),
			});

			if (!res.ok) {
				clearTokens();
				return null;
			}

			const data = (await res.json()) as {
				accessToken: string;
				refreshToken?: string;
			};
			storeTokens(
				data.accessToken,
				data.refreshToken || refreshToken,
			);
			return data.accessToken;
		} catch {
			return null;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

/**
 * Redirects to the signup page (the app's login entry point).
 */
function redirectToLogin(): void {
	if (typeof window === "undefined") return;
	clearTokens();
	window.location.href = "/signup";
}

/**
 * Wraps the global `fetch` to add Authorization headers and handle 401 responses.
 * Call this once at app initialization (e.g., in root.tsx).
 *
 * Usage: setupTokenRefresh();
 */
export function setupTokenRefresh(): void {
	const originalFetch = window.fetch.bind(window);

	window.fetch = async function patchedFetch(
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> {
		const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();

		// Only intercept same-origin API requests
		const isApiRequest =
			url.startsWith("/api/") && !url.includes("/auth/refresh");

		if (!isApiRequest) {
			return originalFetch(input, init);
		}

		// Attach access token if available
		const accessToken = getAccessToken();
		const headers = new Headers(init?.headers);
		if (accessToken) {
			headers.set("Authorization", `Bearer ${accessToken}`);
		}

		let response = await originalFetch(input, {
			...init,
			headers,
		});

		// On 401, try to refresh and retry once
		if (response.status === 401 && accessToken) {
			const newToken = await attemptTokenRefresh();

			if (newToken) {
				// Retry original request with new token
				const retryHeaders = new Headers(init?.headers);
				retryHeaders.set("Authorization", `Bearer ${newToken}`);

				response = await originalFetch(input, {
					...init,
					headers: retryHeaders,
				});
			} else {
				// Refresh failed — redirect to login
				redirectToLogin();
			}
		}

		return response;
	};
}
