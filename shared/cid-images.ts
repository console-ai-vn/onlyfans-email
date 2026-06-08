export interface InlineImageAttachment {
	id: string;
	content_id?: string | null;
	disposition?: string | null;
}

function escapeHtml(text: string) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escapeRegex(text: string) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeCid(value: string) {
	return value
		.trim()
		.replace(/^cid:/i, "")
		.replace(/^<|>$/g, "");
}

function getAttr(tag: string, name: string) {
	const match = tag.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`, "i"));
	return match?.[2] ?? "";
}

function unavailableImagePlaceholder(tag: string) {
	const filename = getAttr(tag, "data-name") || "inline image";
	return `<span role="img" aria-label="Image unavailable" style="display:inline-flex;align-items:center;gap:6px;padding:8px 10px;margin:4px 0;border:1px solid #d1d5db;border-radius:8px;background:#f9fafb;color:#4b5563;font-size:13px;">Image unavailable: ${escapeHtml(filename)} was not included in the email payload.</span>`;
}

export function rewriteCidImages(
	body: string,
	mailboxId: string,
	emailId: string,
	attachments: InlineImageAttachment[] = [],
	origin?: string,
) {
	if (!body) return body;
	let result = body;

	for (const attachment of attachments) {
		if (!attachment.content_id) continue;
		const cid = normalizeCid(attachment.content_id);
		if (!cid) continue;
		const path = `/api/v1/mailboxes/${mailboxId}/emails/${emailId}/attachments/${attachment.id}`;
		const url = origin ? new URL(path, origin).toString() : path;
		result = result
			.replace(new RegExp(`cid:${escapeRegex(cid)}`, "gi"), url)
			.replace(new RegExp(`cid:${escapeRegex(encodeURI(cid))}`, "gi"), url);
	}

	return result.replace(/<img\b[^>]*\bsrc=(["'])cid:([^"']+)\1[^>]*>/gi, (tag) =>
		unavailableImagePlaceholder(tag),
	);
}
