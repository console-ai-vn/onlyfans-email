// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Shared attachment storage logic.
 * Eliminates the triplicated atob → Uint8Array → R2.put pattern.
 */
import type { Env } from "../types";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_MESSAGE_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export interface StoredAttachment {
	id: string;
	email_id: string;
	filename: string;
	mimetype: string;
	size: number;
	content_id: string | null;
	disposition: string;
}

export function estimateBase64DecodedSize(content: string) {
	const padding = content.endsWith("==") ? 2 : content.endsWith("=") ? 1 : 0;
	return Math.max(0, Math.floor((content.length * 3) / 4) - padding);
}

export function assertAllowedImageAttachments(
	attachments: { type: string; size: number }[],
) {
	let totalSize = 0;
	for (const attachment of attachments) {
		if (!ALLOWED_IMAGE_TYPES.has(attachment.type.toLowerCase())) {
			throw new Error("Only JPEG, PNG, and WebP images are allowed");
		}
		if (attachment.size > MAX_IMAGE_SIZE) {
			throw new Error("Each image must be 10MB or smaller");
		}
		totalSize += attachment.size;
	}
	if (totalSize > MAX_MESSAGE_ATTACHMENT_SIZE) {
		throw new Error("Total image attachments must be 25MB or smaller");
	}
}

export function isAllowedInboundImageAttachment(attachment: {
	type: string;
	size: number;
}) {
	try {
		assertAllowedImageAttachments([attachment]);
		return true;
	} catch {
		return false;
	}
}

export function assertAttachmentBelongsToEmail(
	attachment: Pick<StoredAttachment, "email_id">,
	emailId: string,
) {
	if (attachment.email_id !== emailId) {
		throw new Error("Attachment does not belong to this email");
	}
}

/**
 * Store base64-encoded attachments to R2 and return metadata for the DO.
 */
export async function storeAttachments(
	bucket: Env["BUCKET"],
	emailId: string,
	attachments?: {
		content: string;
		filename: string;
		type: string;
		disposition: string;
		contentId?: string;
	}[],
): Promise<StoredAttachment[]> {
	if (!attachments?.length) return [];

	assertAllowedImageAttachments(
		attachments.map((attachment) => ({
			type: attachment.type,
			size: estimateBase64DecodedSize(attachment.content),
		})),
	);

	const results: StoredAttachment[] = [];
	for (const att of attachments) {
		const attachmentId = crypto.randomUUID();
		// Sanitize filename to prevent path traversal in R2 keys
		const safeFilename = (att.filename || "untitled").replace(/[\/\\:*?"<>|\x00-\x1f]/g, "_");
		const key = `attachments/${emailId}/${attachmentId}/${safeFilename}`;
		const binaryStr = atob(att.content);
		const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
		await bucket.put(key, bytes);
		results.push({
			id: attachmentId,
			email_id: emailId,
			filename: safeFilename,
			mimetype: att.type,
			size: bytes.byteLength,
			content_id: att.contentId || null,
			disposition: att.disposition,
		});
	}
	return results;
}
