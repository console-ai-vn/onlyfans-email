export function acceptStripeWebhook(
	body: string,
	signature: string,
	secret: string,
): { ok: false; error: string } {
	console.log("Stripe webhook received but not implemented", {
		bodyLength: body.length,
		signaturePresent: !!signature,
		secretPresent: !!secret,
	})
	return { ok: false, error: "Stripe not yet implemented" }
}
