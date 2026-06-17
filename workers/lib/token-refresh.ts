// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { SignJWT, jwtVerify } from "jose";

const ACCESS_TOKEN_EXPIRY = "12h";
const REFRESH_TOKEN_EXPIRY = "30d";

function getSecretKey(secret: string): Uint8Array {
	return new TextEncoder().encode(secret);
}

/**
 * Generates a refresh token (30-day expiry) for the given email.
 * Used to obtain new access tokens without re-authentication.
 */
export async function generateRefreshToken(
	email: string,
	secret: string,
): Promise<string> {
	const key = getSecretKey(secret);
	return new SignJWT({ sub: email, type: "refresh" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(REFRESH_TOKEN_EXPIRY)
		.sign(key);
}

/**
 * Verifies a refresh token and returns the associated email, or null if invalid/expired.
 */
export async function verifyRefreshToken(
	token: string,
	secret: string,
): Promise<{ email: string } | null> {
	const key = getSecretKey(secret);
	try {
		const { payload } = await jwtVerify(token, key, {
			algorithms: ["HS256"],
		});
		if (payload.type !== "refresh" || !payload.sub) return null;
		if (typeof payload.sub !== "string") return null;
		return { email: payload.sub };
	} catch {
		return null;
	}
}

/**
 * Generates an access token (12-hour expiry) for the given email with optional role.
 */
export async function generateAccessToken(
	email: string,
	secret: string,
	role?: string,
): Promise<string> {
	const key = getSecretKey(secret);
	const payload: Record<string, unknown> = {
		sub: email,
		type: "access",
		role: role || "member",
	};
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(ACCESS_TOKEN_EXPIRY)
		.sign(key);
}

/**
 * Verifies an access token and returns email + role, or null if invalid/expired.
 */
export async function verifyAccessToken(
	token: string,
	secret: string,
): Promise<{ email: string; role: string } | null> {
	const key = getSecretKey(secret);
	try {
		const { payload } = await jwtVerify(token, key, {
			algorithms: ["HS256"],
		});
		if (payload.type !== "access" || !payload.sub) return null;
		if (typeof payload.sub !== "string") return null;
		return {
			email: payload.sub,
			role: (payload.role as string) || "member",
		};
	} catch {
		return null;
	}
}
