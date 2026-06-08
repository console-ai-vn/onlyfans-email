import { normalizeEmailList } from "./access";
import type { Env } from "../types";

export const DOMAIN_CONFIG_KEY = "domains/config.json";

export interface DomainConfig {
	domains: string[];
	emailAddresses: string[];
	accessEmailAddresses: string[];
	cfAccountId?: string;
	accessOtpListId?: string;
}

export interface DomainConfigPatch {
	domains?: string[];
	emailAddresses?: string[];
	accessEmailAddresses?: string[];
	cfAccountId?: string;
	accessOtpListId?: string;
}

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeStringList(values: readonly string[] | undefined) {
	return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function normalizeDomainConfig(input: Partial<DomainConfig>): DomainConfig {
	const cfAccountId = pickOptionalId(input.cfAccountId);
	const accessOtpListId = pickOptionalId(input.accessOtpListId);
	return {
		domains: normalizeStringList(input.domains),
		emailAddresses: [...new Set(normalizeEmailList(input.emailAddresses ?? []))],
		accessEmailAddresses: [
			...new Set(normalizeEmailList(input.accessEmailAddresses ?? [])),
		],
		...(cfAccountId ? { cfAccountId } : {}),
		...(accessOtpListId ? { accessOtpListId } : {}),
	};
}

export function getEnvDomainConfig(env: Env): DomainConfig {
	const domains = (env.DOMAINS || "")
		.split(",")
		.map((domain) => domain.trim())
		.filter(Boolean);
	return normalizeDomainConfig({
		domains,
		emailAddresses: (env.EMAIL_ADDRESSES ?? []) as string[],
		accessEmailAddresses: (env.ACCESS_EMAIL_ADDRESSES ?? []) as string[],
	});
}

export async function getDomainConfig(env: Env): Promise<DomainConfig> {
	const stored = await env.BUCKET.get(DOMAIN_CONFIG_KEY);
	if (!stored) return getEnvDomainConfig(env);
	try {
		const parsed = (await stored.json()) as Partial<DomainConfig>;
		return normalizeDomainConfig(parsed);
	} catch {
		return getEnvDomainConfig(env);
	}
}

export function validateDomainConfig(config: DomainConfig): string | null {
	if (config.domains.length === 0) return "At least one domain is required";

	for (const domain of config.domains) {
		if (!DOMAIN_RE.test(domain)) return `Invalid domain: ${domain}`;
	}

	for (const email of config.emailAddresses) {
		if (!EMAIL_RE.test(email)) return `Invalid email address: ${email}`;
		const domain = email.split("@")[1]?.toLowerCase();
		if (!domain || !config.domains.map((d) => d.toLowerCase()).includes(domain)) {
			return `Email ${email} must use a configured domain`;
		}
	}

	for (const email of config.accessEmailAddresses) {
		if (!EMAIL_RE.test(email)) return `Invalid admin email: ${email}`;
	}

	return null;
}

function pickOptionalId(value: unknown) {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

export async function updateDomainConfig(
	env: Env,
	patch: DomainConfigPatch,
): Promise<DomainConfig> {
	const current = await getDomainConfig(env);
	const next = normalizeDomainConfig({
		domains: patch.domains ?? current.domains,
		emailAddresses: patch.emailAddresses ?? current.emailAddresses,
		accessEmailAddresses:
			patch.accessEmailAddresses ?? current.accessEmailAddresses,
		cfAccountId: patch.cfAccountId ?? current.cfAccountId,
		accessOtpListId: patch.accessOtpListId ?? current.accessOtpListId,
	});
	const validationError = validateDomainConfig(next);
	if (validationError) throw new Error(validationError);

	await env.BUCKET.put(DOMAIN_CONFIG_KEY, JSON.stringify(next, null, 2), {
		httpMetadata: { contentType: "application/json" },
	});
	return next;
}

export function assertAdminAccess(
	accessEmail: string,
	accessEmailAddresses: readonly string[],
) {
	const normalizedAccessEmail = accessEmail.trim().toLowerCase();
	const allowed = normalizeEmailList(accessEmailAddresses);
	if (!normalizedAccessEmail || !allowed.includes(normalizedAccessEmail)) {
		throw new Error("Admin access required");
	}
}