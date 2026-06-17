import type { Env } from "../types"

interface SepayQrResponse {
	success: boolean
	qr_code?: string
	transaction_id?: string
	error?: string
}

export async function generateVietQR(
	env: Env,
	amount: number,
	description: string,
): Promise<{ qrCode: string; txnId: string }> {
	const apiKey = env.SEPAY_API_KEY
	if (!apiKey) {
		throw new Error("SEPAY_API_KEY is not configured")
	}

	const body = {
		amount,
		description: description.slice(0, 100),
	}

	const res = await fetch("https://sepay.vn/api/v1/qr/generate", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${apiKey}`,
		},
		body: JSON.stringify(body),
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`SePay API error: ${res.status} ${text}`)
	}

	const data = (await res.json()) as SepayQrResponse

	if (!data.success || !data.qr_code) {
		throw new Error(data.error || "Failed to generate VietQR")
	}

	const txnId = data.transaction_id || crypto.randomUUID()

	return {
		qrCode: data.qr_code,
		txnId,
	}
}

export async function verifyWebhook(
	body: string,
	signature: string,
	secret: string,
): Promise<boolean> {
	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	)

	const expectedSig = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(body),
	)

	const expectedHex = Array.from(new Uint8Array(expectedSig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")

	return signature.toLowerCase() === expectedHex.toLowerCase()
}

export function parseWebhookEvent(body: string): {
	type: string
	amount: number
	txnId: string
	description: string
} {
	const data = JSON.parse(body) as Record<string, unknown>
	return {
		type: String(data.type || data.event_type || "unknown"),
		amount: Number(data.amount || data.transfer_amount || 0),
		txnId: String(data.transaction_id || data.txn_id || ""),
		description: String(data.description || data.content || ""),
	}
}
