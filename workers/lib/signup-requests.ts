import { normalizeEmail } from "./access";
import { getDomainConfig, updateDomainConfig } from "./admin";
import { seedMailboxTeamAccess } from "./board-access";
import { getMailboxStub } from "./email-helpers";
import {
	defaultMailboxSettings,
	mergeMailboxAllowlist,
	normalizeSignupEmail,
} from "./signup-request-utils";
import type { Env } from "../types";

export { defaultMailboxSettings, mergeMailboxAllowlist } from "./signup-request-utils";

export const SIGNUP_REQUEST_PREFIX = "signup-requests/";

export type SignupRequestStatus = "pending" | "approved" | "rejected";

export interface SignupRequestRecord {
	id: string;
	status: SignupRequestStatus;
	createdAt: string;
	displayName: string;
	personalEmail: string;
	desiredMailbox: string;
	note: string;
	storageKey: string;
	approvedAt?: string;
	approvedBy?: string;
	adminNote?: string;
	rejectedAt?: string;
	rejectedBy?: string;
}

export interface ApproveSignupResult {
	request: SignupRequestRecord;
	mailboxCreated: boolean;
	permissionGranted: boolean;
	accessReminder: string;
}

function parseSignupRequest(
	storageKey: string,
	raw: Record<string, unknown>,
): SignupRequestRecord | null {
	const id = typeof raw.id === "string" ? raw.id : "";
	const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
	const displayName = typeof raw.displayName === "string" ? raw.displayName : "";
	const personalEmail =
		typeof raw.personalEmail === "string" ? normalizeSignupEmail(raw.personalEmail) : "";
	const desiredMailbox =
		typeof raw.desiredMailbox === "string" ? normalizeSignupEmail(raw.desiredMailbox) : "";
	if (!id || !createdAt || !displayName || !personalEmail || !desiredMailbox) {
		return null;
	}
	const status =
		raw.status === "approved" || raw.status === "rejected" ? raw.status : "pending";
	return {
		id,
		status,
		createdAt,
		displayName,
		personalEmail,
		desiredMailbox,
		note: typeof raw.note === "string" ? raw.note : "",
		storageKey,
		approvedAt: typeof raw.approvedAt === "string" ? raw.approvedAt : undefined,
		approvedBy: typeof raw.approvedBy === "string" ? raw.approvedBy : undefined,
		adminNote: typeof raw.adminNote === "string" ? raw.adminNote : undefined,
		rejectedAt: typeof raw.rejectedAt === "string" ? raw.rejectedAt : undefined,
		rejectedBy: typeof raw.rejectedBy === "string" ? raw.rejectedBy : undefined,
	};
}

async function listSignupRequestKeys(bucket: R2Bucket) {
	const keys: string[] = [];
	let cursor: string | undefined;
	do {
		const page = await bucket.list({ prefix: SIGNUP_REQUEST_PREFIX, cursor });
		for (const object of page.objects) keys.push(object.key);
		cursor = page.truncated ? page.cursor : undefined;
	} while (cursor);
	return keys;
}

export async function listSignupRequests(env: Env): Promise<SignupRequestRecord[]> {
	const keys = await listSignupRequestKeys(env.BUCKET);
	const requests = await Promise.all(
		keys.map(async (storageKey) => {
			const obj = await env.BUCKET.get(storageKey);
			if (!obj) return null;
			try {
				const raw = (await obj.json()) as Record<string, unknown>;
				return parseSignupRequest(storageKey, raw);
			} catch {
				return null;
			}
		}),
	);
	return requests
		.filter((entry): entry is SignupRequestRecord => entry !== null)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function loadSignupRequest(
	env: Env,
	requestId: string,
): Promise<SignupRequestRecord> {
	const keys = await listSignupRequestKeys(env.BUCKET);
	for (const storageKey of keys) {
		if (!storageKey.endsWith(`-${requestId}.json`)) continue;
		const obj = await env.BUCKET.get(storageKey);
		if (!obj) break;
		const raw = (await obj.json()) as Record<string, unknown>;
		const parsed = parseSignupRequest(storageKey, raw);
		if (parsed?.id === requestId) return parsed;
	}
	throw new Error("Signup request not found");
}

async function saveSignupRequest(env: Env, request: SignupRequestRecord) {
	const payload = {
		id: request.id,
		status: request.status,
		createdAt: request.createdAt,
		displayName: request.displayName,
		personalEmail: request.personalEmail,
		desiredMailbox: request.desiredMailbox,
		note: request.note,
		approvedAt: request.approvedAt,
		approvedBy: request.approvedBy,
		adminNote: request.adminNote,
		rejectedAt: request.rejectedAt,
		rejectedBy: request.rejectedBy,
	};
	await env.BUCKET.put(request.storageKey, JSON.stringify(payload, null, 2), {
		httpMetadata: { contentType: "application/json" },
	});
}

export async function approveSignupRequest(
	env: Env,
	requestId: string,
	actorEmail: string,
	adminNote = "",
): Promise<ApproveSignupResult> {
	const request = await loadSignupRequest(env, requestId);
	if (request.status !== "pending") {
		throw new Error(`Signup request is already ${request.status}`);
	}

	const mailboxEmail = request.desiredMailbox;
	const config = await getDomainConfig(env);
	const nextAddresses = mergeMailboxAllowlist(config.emailAddresses, mailboxEmail);
	if (nextAddresses.length !== config.emailAddresses.length) {
		await updateDomainConfig(env, { emailAddresses: nextAddresses });
	}

	const mailboxKey = `mailboxes/${mailboxEmail}.json`;
	let mailboxCreated = false;
	if (!(await env.BUCKET.head(mailboxKey))) {
		await env.BUCKET.put(
			mailboxKey,
			JSON.stringify(defaultMailboxSettings(request.displayName)),
		);
		mailboxCreated = true;
	}

	const stub = getMailboxStub(env, mailboxEmail);
	await stub.getFolders();
	await seedMailboxTeamAccess(env, mailboxEmail, normalizeEmail(actorEmail));

	let permissionGranted = false;
	const personalEmail = request.personalEmail;
	if (personalEmail !== mailboxEmail) {
		const existing = await stub.getExplicitMailboxRole(personalEmail);
		if (!existing) {
			await stub.grantMailboxPermission(personalEmail, "member", normalizeEmail(actorEmail));
			permissionGranted = true;
		}
	}

	const approvedAt = new Date().toISOString();
	const updated: SignupRequestRecord = {
		...request,
		status: "approved",
		approvedAt,
		approvedBy: normalizeEmail(actorEmail),
		adminNote: adminNote.trim() || undefined,
	};
	await saveSignupRequest(env, updated);

	return {
		request: updated,
		mailboxCreated,
		permissionGranted,
		accessReminder: `Add ${personalEmail} to Cloudflare Access OTP allowlist for box.vsbg.vn`,
	};
}