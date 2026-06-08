export function normalizeSignupEmail(value: string) {
	return value.trim().toLowerCase();
}

export function mergeMailboxAllowlist(
	addresses: readonly string[],
	mailbox: string,
): string[] {
	const normalized = normalizeSignupEmail(mailbox);
	const merged = new Set(addresses.map((entry) => normalizeSignupEmail(entry)));
	merged.add(normalized);
	return [...merged];
}

export function defaultMailboxSettings(displayName: string) {
	const fromName = displayName.trim() || "User";
	return {
		fromName,
		forwarding: { enabled: false, email: "" },
		signature: { enabled: false, text: "" },
		autoReply: { enabled: false, subject: "", message: "" },
	};
}