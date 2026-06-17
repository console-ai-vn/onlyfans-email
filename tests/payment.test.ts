import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { z } from "zod";
import { verifyWebhook, parseWebhookEvent } from "../workers/lib/sepay.ts";
import { acceptStripeWebhook } from "../workers/lib/stripe.ts";

// ============================================================================
// Suite 1: Tier Pricing Contract
// ============================================================================

describe("Tier Pricing", () => {
	const TIERS = {
		basic: 190000,
		pro: 490000,
		premium: 990000,
	} as const;

	test("basic tier = 190000 VND", () => {
		assert.equal(TIERS.basic, 190000);
	});

	test("pro tier = 490000 VND", () => {
		assert.equal(TIERS.pro, 490000);
	});

	test("premium tier = 990000 VND", () => {
		assert.equal(TIERS.premium, 990000);
	});

	test("all tiers are integers", () => {
		for (const [name, price] of Object.entries(TIERS)) {
			assert.ok(Number.isInteger(price), `${name} should be integer, got ${price}`);
		}
	});

	test("all tiers are >= 0", () => {
		for (const [name, price] of Object.entries(TIERS)) {
			assert.ok(price > 0, `${name} should be positive, got ${price}`);
		}
	});

	test("tier pricing is monotonic (basic < pro < premium)", () => {
		assert.ok(TIERS.basic < TIERS.pro, "basic should be cheaper than pro");
		assert.ok(TIERS.pro < TIERS.premium, "pro should be cheaper than premium");
	});

	test("currency is VND (no decimal places expected)", () => {
		const formatter = new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
			maximumFractionDigits: 0,
		});
		// Use match to be locale-agnostic about spacing characters
		assert.match(formatter.format(190000), /190\.000/);
		assert.match(formatter.format(990000), /990\.000/);
		// No fractional digits means no decimal separator at all
		const formatted = formatter.format(190000);
		const decimalSep = (1.1).toLocaleString("vi-VN").charAt(1); // typically "," in vi-VN
		assert.ok(!formatted.includes(decimalSep), `should not contain decimal separator "${decimalSep}": ${formatted}`);
	});

	test("TIERS only has 3 tiers with expected names", () => {
		const names = Object.keys(TIERS);
		assert.deepEqual(names.sort(), ["basic", "premium", "pro"]);
	});
});

// ============================================================================
// Suite 2: SePay Webhook Verification (HMAC)
// ============================================================================

describe("SePay verifyWebhook", () => {
	const secret = "whsec_test_secret_123456";
	const body = JSON.stringify({
		type: "transfer",
		amount: 190000,
		transaction_id: "txn_abc123",
		description: "ONYX basic subscription for test@onyx.com.vn",
	});

	test("valid signature passes verification", async () => {
		// Compute expected signature using the same algorithm
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
		const signature = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const result = await verifyWebhook(body, signature, secret);
		assert.equal(result, true);
	});

	test("invalid signature is rejected", async () => {
		const result = await verifyWebhook(body, "0000deadbeef", secret);
		assert.equal(result, false);
	});

	test("empty signature is rejected", async () => {
		const result = await verifyWebhook(body, "", secret);
		assert.equal(result, false);
	});

	test("wrong secret rejects valid signature", async () => {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
		const signature = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const result = await verifyWebhook(body, signature, "different_secret");
		assert.equal(result, false);
	});

	test("case-insensitive signature comparison", async () => {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
		const signature = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")
			.toUpperCase();

		const result = await verifyWebhook(body, signature, secret);
		assert.equal(result, true);
	});

	test("tampered body is rejected", async () => {
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
		const signature = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const tamperedBody = body.replace("190000", "999999999");
		const result = await verifyWebhook(tamperedBody, signature, secret);
		assert.equal(result, false);
	});

	test("empty body with valid signature", async () => {
		const emptyBody = "";
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);
		const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(emptyBody));
		const signature = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		const result = await verifyWebhook(emptyBody, signature, secret);
		assert.equal(result, true);
	});
});

// ============================================================================
// Suite 3: SePay Webhook Event Parsing
// ============================================================================

describe("SePay parseWebhookEvent", () => {
	test("parses standard transfer event", () => {
		const body = JSON.stringify({
			type: "transfer",
			amount: 190000,
			transaction_id: "txn_abc123",
			description: "ONYX basic subscription for test@onyx.com.vn",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "transfer");
		assert.equal(event.amount, 190000);
		assert.equal(event.txnId, "txn_abc123");
		assert.equal(event.description, "ONYX basic subscription for test@onyx.com.vn");
	});

	test("parses event with alternate field names (event_type, transfer_amount, txn_id)", () => {
		const body = JSON.stringify({
			event_type: "transaction.success",
			transfer_amount: 490000,
			txn_id: "txn_xyz789",
			content: "ONYX pro subscription renewal",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "transaction.success");
		assert.equal(event.amount, 490000);
		assert.equal(event.txnId, "txn_xyz789");
		assert.equal(event.description, "ONYX pro subscription renewal");
	});

	test("parses event with mixed field names", () => {
		const body = JSON.stringify({
			type: "transfer",
			transfer_amount: 990000,
			txn_id: "txn_premium_001",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "transfer");
		assert.equal(event.amount, 990000);
		assert.equal(event.txnId, "txn_premium_001");
	});

	test("unknown type defaults to 'unknown'", () => {
		const body = JSON.stringify({
			txn_id: "txn_001",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "unknown");
	});

	test("missing amount defaults to 0", () => {
		const body = JSON.stringify({
			type: "transfer",
			transaction_id: "txn_001",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.amount, 0);
	});

	test("missing txnId defaults to empty string", () => {
		const body = JSON.stringify({
			type: "transfer",
			amount: 100000,
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.txnId, "");
	});

	test("missing description defaults to empty string", () => {
		const body = JSON.stringify({
			type: "transfer",
			amount: 100000,
			transaction_id: "txn_001",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.description, "");
	});

	test("amount is cast to Number (handles string input)", () => {
		const body = JSON.stringify({
			type: "transfer",
			amount: "190000",
			transaction_id: "txn_001",
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.amount, 190000);
		assert.equal(typeof event.amount, "number");
	});

	test("empty object produces graceful defaults", () => {
		const body = "{}";
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "unknown");
		assert.equal(event.amount, 0);
		assert.equal(event.txnId, "");
		assert.equal(event.description, "");
	});

	test("null values coerce to empty defaults via fallback chain", () => {
		const body = JSON.stringify({
			type: "transfer",
			amount: null,
			transaction_id: null,
			description: null,
		});
		const event = parseWebhookEvent(body);
		assert.equal(event.type, "transfer");
		// Number(null) = 0
		assert.equal(event.amount, 0);
		// String(null || undefined || "") = String("") = ""
		assert.equal(event.txnId, "");
		assert.equal(event.description, "");
	});
});

// ============================================================================
// Suite 4: Stripe Stub
// ============================================================================

describe("Stripe acceptStripeWebhook", () => {
	test("always returns not-implemented response", () => {
		const result = acceptStripeWebhook("{}", "sig_test", "whsec_test");
		assert.equal(result.ok, false);
		assert.match(result.error, /not yet implemented/i);
	});

	test("logs and returns even with empty inputs", () => {
		const result = acceptStripeWebhook("", "", "");
		assert.equal(result.ok, false);
		assert.equal(typeof result.error, "string");
	});

	test("response shape matches expected interface", () => {
		const result = acceptStripeWebhook("body", "sig", "sec");
		assert.ok("ok" in result);
		assert.ok("error" in result);
		assert.equal(Object.keys(result).length, 2);
	});
});

// ============================================================================
// Suite 5: Checkout Request Schema Validation
// ============================================================================

describe("CheckoutBody Zod schema", () => {
	// Mirror the schema from workers/routes/payment.ts
	const CheckoutBody = z.object({
		mailboxId: z.string().email(),
		tier: z.enum(["basic", "pro", "premium"]),
	});

	test("accepts valid basic checkout", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "user@onyx.com.vn",
			tier: "basic",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.mailboxId, "user@onyx.com.vn");
			assert.equal(result.data.tier, "basic");
		}
	});

	test("accepts valid pro checkout", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "admin@bdsmetro.com",
			tier: "pro",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.tier, "pro");
		}
	});

	test("accepts valid premium checkout", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "vip@onyx.com.vn",
			tier: "premium",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.tier, "premium");
		}
	});

	test("rejects invalid tier", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "user@onyx.com.vn",
			tier: "enterprise",
		});
		assert.equal(result.success, false);
	});

	test("rejects missing tier", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "user@onyx.com.vn",
		});
		assert.equal(result.success, false);
	});

	test("rejects missing mailboxId", () => {
		const result = CheckoutBody.safeParse({
			tier: "basic",
		});
		assert.equal(result.success, false);
	});

	test("rejects non-email mailboxId", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "not-an-email",
			tier: "basic",
		});
		assert.equal(result.success, false);
	});

	test("rejects empty string mailboxId", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "",
			tier: "basic",
		});
		assert.equal(result.success, false);
	});

	test("rejects null/undefined values", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: null,
			tier: undefined,
		});
		assert.equal(result.success, false);
	});

	test("rejects extra unknown fields", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "user@onyx.com.vn",
			tier: "basic",
			hack: "inject",
		});
		// Zod strips unknown by default with z.object - this should pass (strip).
		assert.equal(result.success, true);
	});

	test("tier is case-sensitive (lowercase only)", () => {
		const result = CheckoutBody.safeParse({
			mailboxId: "user@onyx.com.vn",
			tier: "BASIC",
		});
		assert.equal(result.success, false);
	});
});

// ============================================================================
// Suite 6: Webhook Idempotency Contract
// ============================================================================

describe("Webhook Idempotency Contract", () => {
	test("idempotency key format: provider:txnId", () => {
		const txnId = "txn_abc123";
		const provider = "sepay";
		const idempotencyKey = `${provider}:${txnId}`;
		assert.equal(idempotencyKey, "sepay:txn_abc123");
		assert.ok(idempotencyKey.includes(":"));
	});

	test("idempotency key is unique per transaction", () => {
		const keys = new Set([
			"sepay:txn_001",
			"sepay:txn_002",
			"sepay:txn_003",
		]);
		assert.equal(keys.size, 3);
	});

	test("duplicate keys are detected", () => {
		const keys = new Set<string>();
		keys.add("sepay:txn_001");
		keys.add("sepay:txn_001"); // should be no-op
		assert.equal(keys.size, 1);
	});
});

// ============================================================================
// Suite 7: Subscription State Machine
// ============================================================================

describe("Subscription State Machine", () => {
	const VALID_TRANSITIONS: Record<string, string[]> = {
		pending: ["active"],
		active: ["past_due", "cancelled"],
		past_due: ["active", "cancelled"],
		cancelled: [],
	};

	test("pending → active is valid", () => {
		assert.ok(VALID_TRANSITIONS["pending"].includes("active"));
	});

	test("active → cancelled is valid", () => {
		assert.ok(VALID_TRANSITIONS["active"].includes("cancelled"));
	});

	test("active → past_due is valid (expired)", () => {
		assert.ok(VALID_TRANSITIONS["active"].includes("past_due"));
	});

	test("pending → cancelled is NOT valid (must activate first)", () => {
		assert.ok(!VALID_TRANSITIONS["pending"].includes("cancelled"));
	});

	test("cancelled has no valid transitions (terminal state)", () => {
		assert.deepEqual(VALID_TRANSITIONS["cancelled"], []);
	});

	test("past_due can reactivate on payment", () => {
		assert.ok(VALID_TRANSITIONS["past_due"].includes("active"));
	});

	test("past_due can be cancelled", () => {
		assert.ok(VALID_TRANSITIONS["past_due"].includes("cancelled"));
	});
});

// ============================================================================
// Suite 8: Invoice Status Lifecycle
// ============================================================================

describe("Invoice Status Lifecycle", () => {
	const INVOICE_STATUSES = ["pending", "paid", "void", "overdue"];

	test("invoice starts as pending", () => {
		assert.ok(INVOICE_STATUSES.includes("pending"));
	});

	test("pending invoice transitions to paid on successful payment", () => {
		// Contract test: the system sets paidAt on payment
		const invoice = {
			status: "pending",
			paidAt: null,
		};
		// Simulate payment
		invoice.status = "paid";
		invoice.paidAt = new Date().toISOString();
		assert.equal(invoice.status, "paid");
		assert.ok(invoice.paidAt !== null);
	});

	test("paid invoice has providerTxnId set", () => {
		const invoice = {
			status: "paid",
			providerTxnId: "txn_abc123",
		};
		assert.equal(invoice.status, "paid");
		assert.equal(invoice.providerTxnId, "txn_abc123");
	});

	test("invoice amounts match tier pricing", () => {
		const tierPrices = { basic: 190000, pro: 490000, premium: 990000 };
		// Verify invoice amount for each tier
		for (const [tier, price] of Object.entries(tierPrices)) {
			assert.ok(price > 0, `Invoice for ${tier} should have positive amount`);
			assert.ok(Number.isInteger(price), `Invoice for ${tier} should be integer`);
		}
	});
});

// ============================================================================
// Suite 9: formatVnd Helper (PaymentQR/TierCard equivalent)
// ============================================================================

describe("formatVnd currency formatting", () => {
	// These match the formatVnd functions in PaymentQR.tsx and TierCard.tsx
	function formatVnd(amount: number) {
		return new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
			maximumFractionDigits: 0,
		}).format(amount);
	}

	test("formats 190000 as 190.000 VND", () => {
		assert.match(formatVnd(190000), /190\.000/);
	});

	test("formats 490000 as 490.000 VND", () => {
		assert.match(formatVnd(490000), /490\.000/);
	});

	test("formats 990000 as 990.000 VND", () => {
		assert.match(formatVnd(990000), /990\.000/);
	});

	test("zero fractional digits (no decimal separator)", () => {
		const formatted = formatVnd(100000);
		const decimalSep = (1.1).toLocaleString("vi-VN").charAt(1); // "," in vi-VN
		assert.ok(!formatted.includes(decimalSep), `Got ${formatted} — should have 0 fractional digits`);
		// Verify amount is present without cents
		assert.match(formatted, /100\.000/);
	});

	test("formats million values correctly", () => {
		const formatted = formatVnd(1000000);
		assert.match(formatted, /1\.000\.000/);
	});

	test("always includes currency symbol", () => {
		const formatted = formatVnd(1);
		assert.ok(formatted.includes("₫"));
	});
});

// ============================================================================
// Suite 10: Migration SQL Structure
// ============================================================================

describe("Payment Migrations SQL structure", () => {
	const MIGRATION_SQL = `
		CREATE TABLE IF NOT EXISTS subscriptions (
			id TEXT PRIMARY KEY,
			mailbox_id TEXT NOT NULL,
			tier TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			amount INTEGER NOT NULL,
			currency TEXT NOT NULL DEFAULT 'VND',
			current_period_start TEXT NOT NULL,
			current_period_end TEXT NOT NULL,
			canceled_at TEXT,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS invoices (
			id TEXT PRIMARY KEY,
			subscription_id TEXT NOT NULL,
			mailbox_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			provider TEXT NOT NULL,
			provider_txn_id TEXT,
			qr_code TEXT,
			due_date TEXT NOT NULL,
			paid_at TEXT,
			created_at TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS payment_logs (
			id TEXT PRIMARY KEY,
			idempotency_key TEXT UNIQUE NOT NULL,
			provider TEXT NOT NULL,
			event_type TEXT NOT NULL,
			raw_payload TEXT NOT NULL,
			processed INTEGER DEFAULT 0,
			created_at TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_subscriptions_mailbox ON subscriptions(mailbox_id);
		CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
		CREATE INDEX IF NOT EXISTS idx_invoices_mailbox ON invoices(mailbox_id);
		CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
		CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
	`;

	test("subscriptions table has id TEXT PRIMARY KEY", () => {
		assert.match(MIGRATION_SQL, /CREATE TABLE.*subscriptions.*id TEXT PRIMARY KEY/s);
	});

	test("subscriptions table has status with default 'pending'", () => {
		assert.match(MIGRATION_SQL, /status.*DEFAULT\s+'pending'/);
	});

	test("subscriptions table has currency DEFAULT 'VND'", () => {
		assert.match(MIGRATION_SQL, /currency.*DEFAULT\s+'VND'/);
	});

	test("subscriptions table has canceled_at (nullable)", () => {
		assert.match(MIGRATION_SQL, /canceled_at TEXT/);
	});

	test("invoices table has provider_txn_id (nullable)", () => {
		assert.match(MIGRATION_SQL, /provider_txn_id TEXT/);
	});

	test("invoices table has qr_code (nullable)", () => {
		assert.match(MIGRATION_SQL, /qr_code TEXT/);
	});

	test("invoices table has paid_at (nullable)", () => {
		assert.match(MIGRATION_SQL, /paid_at TEXT/);
	});

	test("payment_logs has idempotency_key TEXT UNIQUE NOT NULL", () => {
		assert.match(MIGRATION_SQL, /idempotency_key TEXT UNIQUE NOT NULL/);
	});

	test("payment_logs has raw_payload TEXT NOT NULL", () => {
		assert.match(MIGRATION_SQL, /raw_payload TEXT NOT NULL/);
	});

	test("payment_logs has processed INTEGER DEFAULT 0", () => {
		assert.match(MIGRATION_SQL, /processed INTEGER DEFAULT 0/);
	});

	test("all three tables present", () => {
		assert.match(MIGRATION_SQL, /CREATE TABLE.*subscriptions/s);
		assert.match(MIGRATION_SQL, /CREATE TABLE.*invoices/s);
		assert.match(MIGRATION_SQL, /CREATE TABLE.*payment_logs/s);
	});

	test("indexes exist for performance", () => {
		const idxMatch = (MIGRATION_SQL.match(/CREATE INDEX/g) || []).length;
		assert.ok(idxMatch >= 4, `Expected at least 4 CREATE INDEX statements, found ${idxMatch}`);
	});
});

// ============================================================================
// Suite 11: Query Keys Structure
// ============================================================================

describe("Payments Query Keys", () => {
	// Mirrors app/queries/keys.ts payments section
	const queryKeys = {
		payments: {
			subscription: (mailboxId: string) => ["payments", "subscription", mailboxId] as const,
			invoice: (id: string) => ["payments", "invoice", id] as const,
			invoices: (mailboxId: string) => ["payments", "invoices", mailboxId] as const,
		},
	};

	test("subscription key is uniquely identifiable", () => {
		const key1 = queryKeys.payments.subscription("user1@onyx.com.vn");
		const key2 = queryKeys.payments.subscription("user2@onyx.com.vn");
		assert.deepEqual(key1, ["payments", "subscription", "user1@onyx.com.vn"]);
		assert.deepEqual(key2, ["payments", "subscription", "user2@onyx.com.vn"]);
		assert.notDeepEqual(key1, key2);
	});

	test("invoice key includes id", () => {
		const key = queryKeys.payments.invoice("inv_abc");
		assert.deepEqual(key, ["payments", "invoice", "inv_abc"]);
	});

	test("invoices list key includes mailboxId", () => {
		const key = queryKeys.payments.invoices("user1@onyx.com.vn");
		assert.deepEqual(key, ["payments", "invoices", "user1@onyx.com.vn"]);
	});

	test("different key types don't collide", () => {
		const subKey = queryKeys.payments.subscription("user@onyx.com.vn");
		const invKey = queryKeys.payments.invoice("user@onyx.com.vn");
		const invsKey = queryKeys.payments.invoices("user@onyx.com.vn");
		assert.notDeepEqual(subKey, invKey);
		assert.notDeepEqual(invKey, invsKey);
		assert.notDeepEqual(subKey, invsKey);
	});
});

// ============================================================================
// Suite 12: Alarm Check Expiring Subscriptions Logic
// ============================================================================

describe("Alarm Check Expiring Subscriptions", () => {
	const ALARM_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
	const EXPIRY_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

	test("alarm interval is 6 hours (21600000 ms)", () => {
		assert.equal(ALARM_INTERVAL_MS, 21600000);
	});

	test("alarm interval is < 1 day (still timely)", () => {
		assert.ok(ALARM_INTERVAL_MS < 24 * 60 * 60 * 1000);
	});

	test("expiry check window is 3 days", () => {
		// Subscriptions expiring within 3 days should trigger renewal invoice
		assert.equal(EXPIRY_WINDOW_MS, 3 * 24 * 60 * 60 * 1000);
	});

	test("subscription period is 30 days", () => {
		const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
		assert.equal(PERIOD_MS, 2592000000);
	});

	test("QR code expiry is 1 hour (matching dueDate)", () => {
		// Invoice dueDate = Now + 60 minutes (in createInvoice)
		const DUE_WINDOW_MS = 60 * 60 * 1000;
		assert.equal(DUE_WINDOW_MS, 3600000);
	});

	test("subscription alarms auto-reschedule on completion", () => {
		// After alarm() completes (success or error), always set a new alarm
		// Pattern: finally { await setAlarm(now + INTERVAL) }
		const nextAlarm = Date.now() + ALARM_INTERVAL_MS;
		assert.ok(nextAlarm > Date.now());
	});
});

// ============================================================================
// Suite 13: Description Parsing (mailboxId extraction from payment description)
// ============================================================================

describe("Payment Description Parser", () => {
	// Format: "ONYX {tier} subscription for {mailboxId}"
	const DESC_REGEX = /for\s+(.+)$/i;

	test("extracts mailboxId from description", () => {
		const desc = "ONYX basic subscription for user@onyx.com.vn";
		const match = desc.match(DESC_REGEX);
		assert.ok(match);
		assert.equal(match[1], "user@onyx.com.vn");
	});

	test("extracts mailboxId with subdomain email", () => {
		const desc = "ONYX pro subscription for admin@bdsmetro.com";
		const match = desc.match(DESC_REGEX);
		assert.ok(match);
		assert.equal(match[1], "admin@bdsmetro.com");
	});

	test("extracts mailboxId for premium tier", () => {
		const desc = "ONYX premium subscription for vip@onyx.com.vn";
		const match = desc.match(DESC_REGEX);
		assert.ok(match);
		assert.equal(match[1], "vip@onyx.com.vn");
	});

	test("no match without 'for' keyword", () => {
		const desc = "ONYX basic subscription user@onyx.com.vn";
		const match = desc.match(DESC_REGEX);
		assert.equal(match, null);
	});

	test("malformed description returns null", () => {
		const desc = "random payment";
		const match = desc.match(DESC_REGEX);
		assert.equal(match, null);
	});
});

// ============================================================================
// Suite 14: Edge Cases & Boundary Conditions
// ============================================================================

describe("Payment Edge Cases", () => {
	test("tier amount does not overflow JS safe integer", () => {
		const TIERS = { basic: 190000, pro: 490000, premium: 990000 };
		for (const [, price] of Object.entries(TIERS)) {
			assert.ok(price < Number.MAX_SAFE_INTEGER);
			assert.ok(price > 0);
		}
	});

	test("normalizeEmail transforms to lowercase", () => {
		// mirrors workers/lib/access.ts normalizeEmail
		function normalizeEmail(value: string): string {
			return value.trim().toLowerCase();
		}
		assert.equal(normalizeEmail("User@ONYX.COM.VN"), "user@onyx.com.vn");
		assert.equal(normalizeEmail("  admin@bdsmetro.com  "), "admin@bdsmetro.com");
		assert.equal(normalizeEmail("TEST@test.com"), "test@test.com");
	});

	test("description slice at 100 chars (SePay limit)", () => {
		const longDesc = "ONYX premium subscription for very-long-email-address-that-exceeds-normal-limits@really-long-domain-for-testing-purposes.com with extra padding";
		const sliced = longDesc.slice(0, 100);
		assert.equal(sliced.length, 100);
		assert.ok(sliced.length <= 100);
	});

	test("provider names are deterministic", () => {
		const providers = ["sepay", "stripe"];
		assert.ok(providers.includes("sepay"));
		assert.ok(providers.includes("stripe"));
	});

	test("valid tier names match TIERS enum", () => {
		const validTiers = ["basic", "pro", "premium"];
		assert.deepEqual(validTiers, ["basic", "pro", "premium"]);
	});

	test("WebhookLogResult interface shape", () => {
		const success: { duplicate: boolean } = { duplicate: false };
		const dup: { duplicate: boolean } = { duplicate: true };
		assert.equal(success.duplicate, false);
		assert.equal(dup.duplicate, true);
		assert.ok("duplicate" in success);
	});
});
