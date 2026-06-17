import { sendEmail } from "../email-sender";
import { buildSignupApprovalEmail } from "./signup-approval-email-content";
import type { SignupRequestRecord } from "./signup-requests";
import type { Env } from "../types";

export { buildSignupApprovalEmail } from "./signup-approval-email-content";

export async function sendSignupApprovalNotification(
	env: Env,
	request: SignupRequestRecord,
): Promise<{ sent: boolean; error?: string }> {
	const fromMailbox =
		((env.EMAIL_ADDRESSES ?? []) as string[]).find((entry) =>
			entry.toLowerCase().endsWith("@onyx.com.vn"),
		) || "admin@onyx.com.vn";
	const { subject, text, html } = buildSignupApprovalEmail(request);
	try {
		await sendEmail(env.EMAIL, {
			to: request.personalEmail,
			from: { email: fromMailbox, name: "ONYX" },
			subject,
			text,
			html,
		});
		return { sent: true };
	} catch (error) {
		return {
			sent: false,
			error: error instanceof Error ? error.message : "Failed to send approval email",
		};
	}
}