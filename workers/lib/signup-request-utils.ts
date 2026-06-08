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
	accessOtpAdded: boolean,
	notificationSent: boolean,
) {
	const otpStatus = accessOtpAdded
		? "Access allowlist updated for mailbox login"
		: "Access allowlist not updated";
	const notifyStatus = notificationSent
		? "welcome email sent to personal contact"
		: "welcome email not sent";
	return `Approved by ${normalizeSignupEmail(actorEmail)}. Login ${normalizeSignupEmail(mailboxEmail)}. ${otpStatus}. ${notifyStatus}.`;
}

export function buildRejectionNote(actorEmail: string) {
	return `Rejected by ${normalizeSignupEmail(actorEmail)}.`;
}