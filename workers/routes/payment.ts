import { Hono } from "hono"
import { z } from "zod"
import { normalizeEmail } from "../lib/access"
import { getPaymentStub } from "../lib/payment-stub"
import { generateVietQR, verifyWebhook, parseWebhookEvent } from "../lib/sepay"
import { acceptStripeWebhook } from "../lib/stripe"
import type { AccessVariables, Env } from "../types"

type PaymentContext = {
	Bindings: Env
	Variables: AccessVariables
}

const app = new Hono<PaymentContext>()

const TIERS: Record<string, number> = {
	basic: 190000,
	pro: 490000,
	premium: 990000,
}

const CheckoutBody = z.object({
	mailboxId: z.string().email(),
	tier: z.enum(["basic", "pro", "premium"]),
})

// POST /api/v1/payments/checkout
app.post("/api/v1/payments/checkout", async (c) => {
	let body: z.infer<typeof CheckoutBody>
	try {
		body = CheckoutBody.parse(await c.req.json())
	} catch {
		return c.json({ error: "Invalid request body. Required: mailboxId (email), tier (basic|pro|premium)" }, 400)
	}

	const mailboxId = normalizeEmail(body.mailboxId)
	const amount = TIERS[body.tier]
	const stub = getPaymentStub(c.env, mailboxId)

	// Block duplicate subscriptions (any status except cancelled)
	const existing = await stub.getSubscription(mailboxId)
	if (existing && existing.status !== "cancelled") {
		return c.json({ error: `Subscription already exists with status: ${existing.status}` }, 409)
	}

	const description = `ONYX ${body.tier} subscription for ${mailboxId}`

	let qrCode: string
	let txnId: string
	try {
		const result = await generateVietQR(c.env, amount, description)
		qrCode = result.qrCode
		txnId = result.txnId
	} catch (error) {
		return c.json({ error: error instanceof Error ? error.message : "Failed to generate payment QR" }, 500)
	}

	// Create subscription and invoice in one flow
	const subscription = await stub.createSubscription(mailboxId, body.tier, amount)
	const invoice = await stub.createInvoice(subscription.id, mailboxId, amount, "sepay", qrCode)

	return c.json({
		subscription,
		invoice,
		qrCode,
		amount,
		tier: body.tier,
	}, 201)
})

// GET /api/v1/payments/invoice/:id
app.get("/api/v1/payments/invoice/:id", async (c) => {
	const invoiceId = c.req.param("id")!
	// We need mailboxId to get the right DO, but invoiceId doesn't encode it.
	// For this simple implementation, we search all known DOs. In practice,
	// the frontend polls with mailboxId available.
	// Alternative: accept ?mailboxId= query param.
	const mailboxId = normalizeEmail(c.req.query("mailboxId") || "")
	if (!mailboxId) {
		return c.json({ error: "mailboxId query param required" }, 400)
	}

	const stub = getPaymentStub(c.env, mailboxId)
	const invoice = await stub.getInvoice(invoiceId)
	if (!invoice) {
		return c.json({ error: "Invoice not found" }, 404)
	}

	const subscription = await stub.getSubscription(mailboxId)

	return c.json({ invoice, subscription })
})

// POST /api/v1/payments/webhook/sepay
app.post("/api/v1/payments/webhook/sepay", async (c) => {
	const body = await c.req.text()
	const signature = c.req.header("x-sepay-signature") || ""
	const secret = c.env.SEPAY_WEBHOOK_SECRET

	if (!secret) {
		return c.json({ error: "Webhook secret not configured" }, 500)
	}

	const valid = await verifyWebhook(body, signature, secret)
	if (!valid) {
		return c.json({ error: "Invalid signature" }, 403)
	}

	const event = parseWebhookEvent(body)
	const idempotencyKey = `sepay:${event.txnId}`

	// Parse description to extract mailboxId
	// Format: "ONYX {tier} subscription for {mailboxId}"
	const descMatch = event.description.match(/for\s+(.+)$/i)
	const mailboxId = descMatch ? normalizeEmail(descMatch[1]) : null

	if (!mailboxId) {
		return c.json({ error: "Cannot determine mailbox from description" }, 400)
	}

	const stub = getPaymentStub(c.env, mailboxId)

	// Check idempotency
	const logResult = await stub.webhookLog(idempotencyKey, "sepay", event.type, body)
	if (logResult.duplicate) {
		return c.json({ status: "duplicate" }, 200)
	}

	// Only handle successful transfers
	if (event.type !== "transfer" && event.type !== "transaction.success") {
		return c.json({ status: "ignored", eventType: event.type }, 200)
	}

	// Find subscription for this mailbox
	const subscription = await stub.getSubscription(mailboxId)
	if (!subscription || subscription.status !== "pending") {
		// Maybe it's a renewal — check for active subscription + pending invoice
		const invoices = await stub.getInvoices(mailboxId)
		const pendingInvoice = invoices.find((inv) => inv.status === "pending")

		if (pendingInvoice && subscription?.status === "active") {
			// Verify amount matches (prevent underpayment)
			const paidAmount = Number(event.amount)
			if (paidAmount < pendingInvoice.amount) {
				return c.json({ error: `Insufficient amount: received ${paidAmount}, expected ${pendingInvoice.amount}` }, 400)
			}
			await stub.activateSubscription(subscription.id, event.txnId)
			return c.json({ status: "renewal_activated" }, 200)
		}

		return c.json({ status: "no_pending_subscription" }, 200)
	}

	// Verify amount matches for initial payment
	const invoices = await stub.getInvoices(mailboxId)
	const pendingInvoice = invoices.find((inv) => inv.status === "pending" && inv.subscriptionId === subscription.id)
	const paidAmount = Number(event.amount)

	if (pendingInvoice && paidAmount < pendingInvoice.amount) {
		return c.json({ error: `Insufficient amount: received ${paidAmount}, expected ${pendingInvoice.amount}` }, 400)
	}

	await stub.activateSubscription(subscription.id, event.txnId)
	return c.json({ status: "activated" }, 200)
})

// POST /api/v1/payments/webhook/stripe
app.post("/api/v1/payments/webhook/stripe", async (c) => {
	const body = await c.req.text()
	const signature = c.req.header("stripe-signature") || ""
	const secret = c.env.STRIPE_WEBHOOK_SECRET || ""

	const result = acceptStripeWebhook(body, signature, secret)
	if (!result.ok) {
		return c.json({ error: result.error }, 501)
	}
	return c.json({ status: "ok" }, 200)
})

// GET /api/v1/payments/subscription/:mailboxId
app.get("/api/v1/payments/subscription/:mailboxId", async (c) => {
	const mailboxId = normalizeEmail(c.req.param("mailboxId")!)
	const stub = getPaymentStub(c.env, mailboxId)
	const subscription = await stub.getSubscription(mailboxId)
	if (!subscription) {
		return c.json({ subscription: null })
	}
	return c.json({ subscription })
})

// POST /api/v1/payments/subscription/:mailboxId/cancel
app.post("/api/v1/payments/subscription/:mailboxId/cancel", async (c) => {
	const mailboxId = normalizeEmail(c.req.param("mailboxId")!)
	const stub = getPaymentStub(c.env, mailboxId)
	const subscription = await stub.getSubscription(mailboxId)

	if (!subscription) {
		return c.json({ error: "No active subscription" }, 404)
	}

	if (subscription.status !== "active" && subscription.status !== "past_due") {
		return c.json({ error: "Subscription is not in a cancellable state" }, 400)
	}

	const cancelled = await stub.cancelSubscription(subscription.id)
	return c.json({ subscription: cancelled })
})

// GET /api/v1/payments/invoices/:mailboxId
app.get("/api/v1/payments/invoices/:mailboxId", async (c) => {
	const mailboxId = normalizeEmail(c.req.param("mailboxId")!)
	const stub = getPaymentStub(c.env, mailboxId)
	const invoices = await stub.getInvoices(mailboxId)
	return c.json({ invoices })
})

export { app }
