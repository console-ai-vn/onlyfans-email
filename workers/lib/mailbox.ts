// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Hono middleware to handle repetitive Mailbox Durable Object instantiation.
 * Checks if the mailbox exists in R2, then instantiates the DO stub
 * and attaches it to the Hono context (`c.var.mailboxStub`).
 */
import { createMiddleware } from "hono/factory";
import type { MailboxDO } from "../durableObject";
import { getDomainConfig } from "./admin";
import {
	PermissionError,
	resolveMailboxRole,
	roleHasPermission,
	type LegacyAccessOptions,
	type MailboxPermission,
	type MailboxRole,
} from "./permissions";
import type { AccessVariables, Env } from "../types";

export type MailboxContext = {
	Bindings: Env;
	Variables: {
		mailboxStub: DurableObjectStub<MailboxDO>;
		mailboxRole: MailboxRole;
	} & AccessVariables;
};

export async function getLegacyAccessOptions(
	env: Env,
	allowMissingIdentity = import.meta.env.DEV,
): Promise<LegacyAccessOptions> {
	const config = await getDomainConfig(env);
	return {
		allowMissingIdentity,
		allowedMailboxIds: config.emailAddresses,
		allowedAccessEmails: config.accessEmailAddresses,
	};
}

export async function resolveContextMailboxRole(
	env: Env,
	accessEmail: string,
	mailboxId: string,
	stub: DurableObjectStub<MailboxDO>,
) {
	return resolveMailboxRole(
		accessEmail,
		mailboxId,
		await getLegacyAccessOptions(env),
		(email) => stub.getExplicitMailboxRole(email),
	);
}

export function assertContextPermission(role: MailboxRole | null, permission: MailboxPermission) {
	if (!role || !roleHasPermission(role, permission)) {
		throw new PermissionError(`Missing permission: ${permission}`);
	}
}

export const requireMailbox = createMiddleware<MailboxContext>(async (c, next) => {
	const rawId = c.req.param("mailboxId");
	if (!rawId) return c.json({ error: "Mailbox ID required" }, 400);
	const mailboxId = decodeURIComponent(rawId);

	const key = `mailboxes/${mailboxId}.json`;
	const obj = await c.env.BUCKET.head(key);
	if (!obj) {
		return c.json({ error: "Not found" }, 404);
	}

	const ns = c.env.MAILBOX;
	const id = ns.idFromName(mailboxId);
	const stub = ns.get(id);

	const role = await resolveContextMailboxRole(
		c.env,
		c.var.accessEmail,
		mailboxId,
		stub,
	);
	if (!role || !roleHasPermission(role, "read")) {
		return c.json({ error: "You do not have access to this mailbox" }, 403);
	}

	c.set("mailboxStub", stub);
	c.set("mailboxRole", role);
	
	await next();
});