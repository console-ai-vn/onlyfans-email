export type SocialParticipantInput = {
	sender?: string | null;
	recipient?: string | null;
	cc?: string | null;
	bcc?: string | null;
};

export function normalizeSocialEmailAddress(value: string): string | null {
	const raw = value.trim();
	if (!raw) return null;

	const angleMatch = raw.match(/<\s*([^<>]+)\s*>/);
	const candidate = (angleMatch?.[1] ?? raw).trim().toLowerCase();
	if (!candidate || !candidate.includes("@")) return null;

	return candidate.replace(/^mailto:/i, "");
}

export function extractSocialParticipants(input: SocialParticipantInput): string[] {
	const seen = new Set<string>();
	const participants: string[] = [];
	const fields = [input.sender, input.recipient, input.cc, input.bcc];

	for (const field of fields) {
		if (!field) continue;
		for (const part of splitAddressList(field)) {
			const normalized = normalizeSocialEmailAddress(part);
			if (!normalized || seen.has(normalized)) continue;
			seen.add(normalized);
			participants.push(normalized);
		}
	}

	return participants;
}

export function socialContactIdForEmail(value: string): string {
	const normalized = normalizeSocialEmailAddress(value);
	if (!normalized) throw new Error("Invalid social contact email");
	return `contact:${normalized}`;
}

function splitAddressList(value: string): string[] {
	return value
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}
