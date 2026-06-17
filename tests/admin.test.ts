import assert from "node:assert/strict";
import test from "node:test";

function normalizeStringList(values: readonly string[] | undefined) {
	return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function normalizeEmail(value: string) {
	return value.trim().toLowerCase();
}

function normalizeEmailList(values: readonly string[]) {
	return values.map(normalizeEmail).filter(Boolean);
}

function normalizeDomainConfig(input: {
	domains?: string[];
	emailAddresses?: string[];
	accessEmailAddresses?: string[];
}) {
	return {
		domains: normalizeStringList(input.domains),
		emailAddresses: [...new Set(normalizeEmailList(input.emailAddresses ?? []))],
		accessEmailAddresses: [
			...new Set(normalizeEmailList(input.accessEmailAddresses ?? [])),
		],
	};
}

function validateDomainConfig(config: {
	domains: string[];
	emailAddresses: string[];
	accessEmailAddresses: string[];
}) {
	if (config.domains.length === 0) return "At least one domain is required";
	for (const email of config.emailAddresses) {
		const domain = email.split("@")[1]?.toLowerCase();
		if (!domain || !config.domains.map((d) => d.toLowerCase()).includes(domain)) {
			return `Email ${email} must use a configured domain`;
		}
	}
	return null;
}

function assertAdminAccess(accessEmail: string, accessEmailAddresses: readonly string[]) {
	const normalizedAccessEmail = accessEmail.trim().toLowerCase();
	const allowed = normalizeEmailList(accessEmailAddresses);
	if (!normalizedAccessEmail || !allowed.includes(normalizedAccessEmail)) {
		throw new Error("Admin access required");
	}
}

test("normalizeDomainConfig deduplicates and lowercases emails", () => {
	assert.deepEqual(
		normalizeDomainConfig({
			domains: ["onyx.com.vn", "onyx.com.vn"],
			emailAddresses: ["Admin@ONYX.COM.VN", "admin@onyx.com.vn"],
			accessEmailAddresses: ["CEO@Example.COM"],
		}),
		{
			domains: ["onyx.com.vn"],
			emailAddresses: ["admin@onyx.com.vn"],
			accessEmailAddresses: ["ceo@example.com"],
		},
	);
});

test("validateDomainConfig rejects emails outside configured domains", () => {
	const error = validateDomainConfig({
		domains: ["onyx.com.vn"],
		emailAddresses: ["ops@other.com"],
		accessEmailAddresses: [],
	});
	assert.match(error ?? "", /configured domain/i);
});

test("assertAdminAccess allows configured admin emails", () => {
	assert.doesNotThrow(() =>
		assertAdminAccess("ceo@example.com", ["ceo@example.com"]),
	);
});

test("assertAdminAccess rejects non-admin users", () => {
	assert.throws(
		() => assertAdminAccess("user@example.com", ["ceo@example.com"]),
		/admin access/i,
	);
});