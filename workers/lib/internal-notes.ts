export const CONVERSATION_EVENT_TYPES = [
	"email_received",
	"email_sent",
	"note_created",
	"state_updated",
] as const;

export type ConversationEventType = (typeof CONVERSATION_EVENT_TYPES)[number];

export function normalizeInternalNoteBody(value: unknown): string {
	if (typeof value !== "string") throw new Error("Internal note body is required");
	const body = value.trim();
	if (!body) throw new Error("Internal note body is required");
	if (body.length > 5_000) throw new Error("Internal note body must be 5000 characters or fewer");
	return body;
}

export function normalizeConversationEventType(value: unknown): ConversationEventType {
	if (
		typeof value !== "string" ||
		!CONVERSATION_EVENT_TYPES.includes(value as ConversationEventType)
	) {
		throw new Error("Invalid conversation event type");
	}
	return value as ConversationEventType;
}
