// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

type RecipientField = string | string[] | undefined;
type RecipientRoutingEnv = {
	EMAIL_ADDRESSES?: readonly string[];
};

export function normalizeRecipientField(field: RecipientField): string[] {
	if (!field) return [];
	const addresses = Array.isArray(field) ? field : [field];
	return addresses.map((addr) => addr.trim().toLowerCase()).filter(Boolean);
}

export function getConfiguredMailboxSet(env: RecipientRoutingEnv) {
	return new Set(
		(env.EMAIL_ADDRESSES ?? []).map((addr) => addr.trim().toLowerCase()),
	);
}

export function getRecipientRouting(
	env: RecipientRoutingEnv,
	recipients: { to: string | string[]; cc?: RecipientField; bcc?: RecipientField },
) {
	const configuredMailboxes = getConfiguredMailboxSet(env);
	const allRecipients = [
		...normalizeRecipientField(recipients.to),
		...normalizeRecipientField(recipients.cc),
		...normalizeRecipientField(recipients.bcc),
	];
	const internalRecipients = [
		...new Set(allRecipients.filter((addr) => configuredMailboxes.has(addr))),
	];
	const externalRecipients = [
		...new Set(allRecipients.filter((addr) => !configuredMailboxes.has(addr))),
	];

	return {
		internalRecipients,
		externalRecipients,
		hasExternalRecipients: externalRecipients.length > 0,
	};
}

export function getInternalOnlyDeliveryError(externalRecipients: string[]) {
	return `External email sending is disabled: ${externalRecipients.join(", ")}. Send only to internal mailboxes.`;
}
