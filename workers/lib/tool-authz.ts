import { filterMailboxIdsForAccess, normalizeEmail } from "./access";
import { getDomainConfig } from "./admin";
import { listMailboxes } from "./email-helpers";
import {
	assertContextPermission,
	getLegacyAccessOptions,
	resolveContextMailboxRole,
} from "./mailbox";
import type { MailboxPermission, MailboxRole } from "./permissions";
import type { Env } from "../types";

export const TOOL_ACCESS_EMAIL_HEADER = "x-vsbg-access-email";

export function readToolAccessEmail(request: Request | Headers): string {
	const headers = request instanceof Headers ? request : request.headers;
	return normalizeEmail(headers.get(TOOL_ACCESS_EMAIL_HEADER) || "");
}

export async function resolveToolMailboxRole(
	env: Env,
	accessEmail: string,
	mailboxId: string,
): Promise<MailboxRole | null> {
	const normalizedMailboxId = normalizeEmail(mailboxId);
	const stub = env.MAILBOX.get(env.MAILBOX.idFromName(normalizedMailboxId));
	return resolveContextMailboxRole(
		env,
		accessEmail,
		normalizedMailboxId,
		stub,
	);
}

export async function assertToolMailboxPermission(
	env: Env,
	accessEmail: string,
	mailboxId: string,
	permission: MailboxPermission,
): Promise<MailboxRole> {
	const role = await resolveToolMailboxRole(env, accessEmail, mailboxId);
	assertContextPermission(role, permission);
	return role!;
}

export function parseAgentMailboxId(pathname: string): string | null {
	const match = pathname.match(/^\/agents\/[^/]+\/([^/]+)/);
	if (!match?.[1]) return null;
	try {
		return normalizeEmail(decodeURIComponent(match[1]));
	} catch {
		return normalizeEmail(match[1]);
	}
}

export function withToolAccessEmail(
	request: Request,
	accessEmail: string,
): Request {
	if (!accessEmail) return request;
	const headers = new Headers(request.headers);
	headers.set(TOOL_ACCESS_EMAIL_HEADER, accessEmail);
	return new Request(request, { headers });
}

export async function listToolAccessibleMailboxes(env: Env, accessEmail: string) {
	const allMailboxes = await listMailboxes(env.BUCKET);
	const config = await getDomainConfig(env);
	const options = await getLegacyAccessOptions(env);
	const visibleIds = new Set(
		filterMailboxIdsForAccess(
			allMailboxes.map((mailbox) => mailbox.id),
			accessEmail,
			options,
		),
	);

	const accessible: Array<{ id: string; email: string }> = [];
	for (const mailbox of allMailboxes) {
		if (visibleIds.has(mailbox.id)) {
			accessible.push(mailbox);
			continue;
		}
		const role = await resolveToolMailboxRole(env, accessEmail, mailbox.id);
		if (role) accessible.push(mailbox);
	}
	return accessible;
}