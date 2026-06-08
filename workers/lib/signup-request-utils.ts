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

export function buildApprovalNote(
	actorEmail: string,
	mailboxEmail: string,
	personalEmail: string,
	accessOtpAdded: boolean,
) {
	const otpStatus = accessOtpAdded
		? "OTP allowlist updated automatically"
		: "OTP allowlist not updated automatically";
	return `Approved by ${normalizeSignupEmail(actorEmail)}. Mailbox ${normalizeSignupEmail(mailboxEmail)}. OTP ${normalizeSignupEmail(personalEmail)}. ${otpStatus}.`;
}

export function buildRejectionNote(actorEmail: string) {
	return `Rejected by ${normalizeSignupEmail(actorEmail)}.`;
}