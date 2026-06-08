// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Folders } from "../../shared/folders";
import type { Env } from "../types";
import { storeAttachments } from "./attachments";
import { getMailboxStub } from "./email-helpers";
import {
	getRecipientRouting,
	normalizeRecipientField,
} from "./recipient-routing";

export type OutboundAttachment = {
	content: string;
	filename: string;
	type: string;
	disposition: "attachment" | "inline";
	contentId?: string;
};

export type InternalDeliveryInput = {
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	from: string | { email: string; name: string };
	subject: string;
	html?: string;
	text?: string;
	attachments?: OutboundAttachment[];
	inReplyTo?: string | null;
	references?: string[];
	threadId?: string | null;
	outgoingMessageId?: string | null;
};

function formatAddressField(field: string | string[] | undefined) {
	return normalizeRecipientField(field).join(", ") || null;
}

function formatFromHeader(from: InternalDeliveryInput["from"]) {
	if (typeof from === "string") return from;
	return `${from.name} <${from.email}>`;
}

function normalizeFromEmail(from: InternalDeliveryInput["from"]) {
	return (typeof from === "string" ? from : from.email).trim().toLowerCase();
}

export async function deliverInternalEmail(env: Env, input: InternalDeliveryInput) {
	const { internalRecipients } = getRecipientRouting(env, input);
	if (internalRecipients.length === 0) return [];

	const sender = normalizeFromEmail(input.from);
	const body = input.html || input.text || "";
	const now = new Date().toISOString();
	const rawHeaders = JSON.stringify([
		{ key: "from", value: formatFromHeader(input.from) },
		{ key: "to", value: formatAddressField(input.to) || "" },
		...(input.cc ? [{ key: "cc", value: formatAddressField(input.cc) || "" }] : []),
		{ key: "subject", value: input.subject },
		{ key: "date", value: now },
		...(input.outgoingMessageId
			? [{ key: "message-id", value: `<${input.outgoingMessageId}>` }]
			: []),
		...(input.inReplyTo
			? [{ key: "in-reply-to", value: `<${input.inReplyTo}>` }]
			: []),
		...(input.references?.length
			? [{
				key: "references",
				value: input.references.map((ref) => `<${ref}>`).join(" "),
			}]
			: []),
	]);

	const delivered: string[] = [];
	for (const mailboxId of internalRecipients) {
		const mailboxKey = `mailboxes/${mailboxId}.json`;
		if (!(await env.BUCKET.head(mailboxKey))) {
			throw new Error(`Internal mailbox ${mailboxId} is configured but missing settings`);
		}

		const messageId = crypto.randomUUID();
		const attachmentData = await storeAttachments(
			env.BUCKET,
			messageId,
			input.attachments,
		);
		const stub = getMailboxStub(env, mailboxId);
		await stub.createEmail(
			Folders.INBOX,
			{
				id: messageId,
				subject: input.subject,
				sender,
				recipient: formatAddressField(input.to) || "",
				cc: formatAddressField(input.cc),
				bcc: null,
				date: now,
				body,
				in_reply_to: input.inReplyTo || null,
				email_references: input.references?.length
					? JSON.stringify(input.references)
					: null,
				thread_id: input.threadId || input.inReplyTo || messageId,
				message_id: input.outgoingMessageId || null,
				raw_headers: rawHeaders,
			},
			attachmentData,
		);
		delivered.push(mailboxId);
	}

	return delivered;
}
