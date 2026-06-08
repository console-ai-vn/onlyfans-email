export const CONVERSATION_STATUSES = ["open", "waiting", "done"] as const;
export const CONVERSATION_PRIORITIES = ["low", "normal", "high"] as const;

export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
export type ConversationPriority = (typeof CONVERSATION_PRIORITIES)[number];

export type ConversationStatePatch = {
	status?: ConversationStatus;
	assignee_email?: string | null;
	priority?: ConversationPriority;
	needs_reply?: boolean;
	last_seen_at?: string | null;
};

export function normalizeConversationStatePatch(input: Record<string, unknown>): ConversationStatePatch {
	const patch: ConversationStatePatch = {};

	if ("status" in input) {
		if (!isAllowed(input.status, CONVERSATION_STATUSES)) {
			throw new Error("Invalid conversation status");
		}
		patch.status = input.status;
	}

	if ("priority" in input) {
		if (!isAllowed(input.priority, CONVERSATION_PRIORITIES)) {
			throw new Error("Invalid conversation priority");
		}
		patch.priority = input.priority;
	}

	if ("assignee_email" in input) {
		patch.assignee_email =
			typeof input.assignee_email === "string" && input.assignee_email.trim()
				? input.assignee_email.trim().toLowerCase()
				: null;
	}

	if ("needs_reply" in input) {
		patch.needs_reply = Boolean(input.needs_reply);
	}

	if ("last_seen_at" in input) {
		patch.last_seen_at =
			typeof input.last_seen_at === "string" && input.last_seen_at.trim()
				? input.last_seen_at.trim()
				: null;
	}

	return patch;
}

function isAllowed<T extends string>(
	value: unknown,
	allowed: readonly T[],
): value is T {
	return typeof value === "string" && allowed.includes(value as T);
}
