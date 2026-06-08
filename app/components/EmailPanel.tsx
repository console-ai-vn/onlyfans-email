// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, useKumoToastManager } from "@cloudflare/kumo";
import {
	ArrowBendUpLeftIcon,
	ChatCircleTextIcon,
	NotePencilIcon,
	RobotIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { Folders } from "shared/folders";
import AgentSidebar from "~/components/AgentSidebar";
import EmailPanelDialogs from "~/components/email-panel/EmailPanelDialogs";
import EmailPanelHeader from "~/components/email-panel/EmailPanelHeader";
import EmailPanelToolbar from "~/components/email-panel/EmailPanelToolbar";
import SingleMessageView from "~/components/email-panel/SingleMessageView";
import ThreadMessage from "~/components/email-panel/ThreadMessage";
import { formatDetailDate } from "~/lib/utils";
import { splitEmailList, toEmailListValue } from "~/lib/utils";
import api from "~/services/api";
import {
	useConversationEvents,
	useConversationState,
	useCreateInternalNote,
	useDeleteEmail,
	useEmail,
	useInternalNotes,
	useMoveEmail,
	useReplyToEmail,
	useSendEmail,
	useThreadReplies,
	useUpdateEmail,
} from "~/queries/emails";
import { useFolders } from "~/queries/folders";
import { useMailbox } from "~/queries/mailboxes";
import { useAvatarVersionMap } from "~/hooks/useAvatarVersions";
import { useUIStore } from "~/hooks/useUIStore";
import type { ConversationEvent, ConversationState, Email, Folder, InternalNote, Mailbox } from "~/types";

function EmailPanelSkeleton() {
	return (
		<div className="animate-pulse p-5 space-y-4">
			<div className="h-5 w-2/3 rounded bg-kumo-fill" />
			<div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-kumo-fill" /><div className="space-y-2 flex-1"><div className="h-3 w-40 rounded bg-kumo-fill" /><div className="h-2.5 w-24 rounded bg-kumo-fill" /></div></div>
			<div className="space-y-2 pt-4"><div className="h-2.5 w-full rounded bg-kumo-fill" /><div className="h-2.5 w-5/6 rounded bg-kumo-fill" /><div className="h-2.5 w-4/6 rounded bg-kumo-fill" /><div className="h-2.5 w-3/4 rounded bg-kumo-fill" /></div>
		</div>
	);
}

export default function EmailPanel({ emailId }: { emailId: string }) {
	const { mailboxId, folder } = useParams<{ mailboxId: string; folder: string }>();
	const { data: email } = useEmail(mailboxId, emailId) as { data?: Email };
	const activeThreadId = email?.thread_id ?? email?.id;
	const { data: threadRepliesRaw } = useThreadReplies(mailboxId, email?.thread_id) as {
		data?: Email[];
	};
	const { data: conversationStateRaw } = useConversationState(mailboxId, activeThreadId);
	const { data: internalNotes = [] } = useInternalNotes(mailboxId, activeThreadId);
	const { data: conversationEvents = [] } = useConversationEvents(mailboxId, activeThreadId);
	const updateEmail = useUpdateEmail();
	const deleteEmailMut = useDeleteEmail();
	const moveEmailMut = useMoveEmail();
	const sendEmailMut = useSendEmail();
	const replyMut = useReplyToEmail();
	const createInternalNote = useCreateInternalNote();
	const { data: folders = [] } = useFolders(mailboxId) as { data?: Folder[] };
	const { data: currentMailbox } = useMailbox(mailboxId) as {
		data?: Mailbox;
	};
	const avatarVersions = useAvatarVersionMap();
	const { closePanel, startCompose } = useUIStore();
	const toastManager = useKumoToastManager();
	const [isSending, setIsSending] = useState(false);
	const [sourceViewEmail, setSourceViewEmail] = useState<Email | null>(null);
	const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
	const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);

	const [isAgentOpen, setIsAgentOpen] = useState(false);
	const [isNoteOpen, setIsNoteOpen] = useState(false);
	const [noteBody, setNoteBody] = useState("");
	const isDraftFolder = folder === Folders.DRAFT;

	const threadReplies = useMemo(() => {
		if (!threadRepliesRaw || !email) return [];
		return threadRepliesRaw.filter((e) => e.id !== email.id);
	}, [threadRepliesRaw, email]);

	const allMessages = useMemo(() => {
		if (!email) return [];
		return [email, ...threadReplies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [email, threadReplies]);

	// Reset expanded state only when the selected email changes, not on every refetch.
	// Using allMessages as a dependency would reset user expand/collapse state on background refetches.
	const currentEmailId = email?.id;
	useEffect(() => { if (allMessages.length > 1) setExpandedMessages(new Set([allMessages[0].id])); }, [currentEmailId]);

	const toggleExpand = (msgId: string) => { setExpandedMessages((prev) => { const next = new Set(prev); if (next.has(msgId)) next.delete(msgId); else next.add(msgId); return next; }); };

	const draftMessageIds = useMemo(() => {
		const ids = new Set<string>();
		for (const msg of allMessages) { if (msg.folder_id === Folders.DRAFT) ids.add(msg.id); else if (isDraftFolder && msg.id === emailId) ids.add(msg.id); }
		return ids;
	}, [allMessages, isDraftFolder, emailId]);

	const lastReceivedMessage = useMemo(() => {
		const ce = currentMailbox?.email;
		const received = allMessages.filter((msg) => !draftMessageIds.has(msg.id) && msg.sender !== ce);
		if (received.length > 0) return received[0];
		const nonDrafts = allMessages.filter((msg) => !draftMessageIds.has(msg.id));
		return nonDrafts.length > 0 ? nonDrafts[0] : email;
	}, [allMessages, draftMessageIds, currentMailbox?.email, email]);

	const moveToFolders = useMemo(() => { const cur = folder || email?.folder_id; return folders.filter((f) => f.id !== cur); }, [folders, folder, email?.folder_id]);

	if (!email) return <EmailPanelSkeleton />;

	const conversationState: ConversationState = conversationStateRaw ?? {
		thread_id: activeThreadId ?? email.id,
		status: email.status ?? "open",
		priority: email.priority ?? "normal",
		needs_reply: email.state_needs_reply ?? email.needs_reply ?? false,
		assignee_email: email.assignee_email,
		last_seen_at: email.last_seen_at,
	};

	const toggleStar = () => { if (mailboxId) updateEmail.mutate({ mailboxId, id: email.id, data: { starred: !email.starred } }); };
	const handleMove = (folderId: string) => { if (mailboxId) { moveEmailMut.mutate({ mailboxId, id: email.id, folderId }); closePanel(); } };
	const handleDelete = () => { if (mailboxId) { if (!window.confirm("Are you sure you want to delete this email?")) return; deleteEmailMut.mutate({ mailboxId, id: email.id }); closePanel(); } };

	const handleCreateNote = async () => {
		if (!mailboxId || !activeThreadId || !noteBody.trim()) return;
		await createInternalNote.mutateAsync({
			mailboxId,
			threadId: activeThreadId,
			body: noteBody.trim(),
		});
		setNoteBody("");
		setIsNoteOpen(false);
	};

	const handleEditDraft = (draftMsg?: Email) => {
		const target = draftMsg || email;
		if (target.in_reply_to) { startCompose({ mode: "reply", originalEmail: allMessages.find((msg) => msg.id === target.in_reply_to), draftEmail: target }); }
		else { startCompose({ mode: "new", originalEmail: undefined, draftEmail: target }); }
	};

	const handleDeleteDraft = async (draftMsg?: Email) => {
		const target = draftMsg || email;
		if (!mailboxId) return;
		if (!window.confirm("Discard this draft?")) return;
		deleteEmailMut.mutate({ mailboxId, id: target.id });
		toastManager.add({ title: "Draft discarded" });
		if (target.id === emailId) closePanel();
	};

	const handleSendDraft = async (draftMsg?: Email) => {
		let target = draftMsg || email;
		if (!mailboxId || !currentMailbox) return;
		setIsSending(true);
		try {
			if (!target.recipient || !target.subject) { try { const fresh = await api.getEmail(mailboxId, target.id) as Email; if (fresh) target = fresh; } catch {} }
			if (!target.recipient) { toastManager.add({ title: "Cannot send: no recipient set on this draft.", variant: "error" }); return; }
			const toRecipients = splitEmailList(target.recipient);
			if (toRecipients.length === 0) { toastManager.add({ title: "Cannot send: no valid recipient set on this draft.", variant: "error" }); return; }
			const fromName = currentMailbox.settings?.fromName || currentMailbox.name;
			const from = fromName && fromName !== currentMailbox.email ? { email: currentMailbox.email, name: fromName } : currentMailbox.email;
			const originalEmail = target.in_reply_to ? allMessages.find((msg) => msg.id === target.in_reply_to) : undefined;
			const emailData = {
				to: toEmailListValue(toRecipients),
				cc: toEmailListValue(splitEmailList(target.cc)),
				bcc: toEmailListValue(splitEmailList(target.bcc)),
				from,
				subject: target.subject || "(no subject)",
				html: target.body || "",
				text: target.body ? target.body.replace(/<[^>]*>/g, "").trim() : "",
			};
			if (originalEmail) await replyMut.mutateAsync({ mailboxId, emailId: originalEmail.id, email: emailData }); else await sendEmailMut.mutateAsync({ mailboxId, email: emailData });
			await deleteEmailMut.mutateAsync({ mailboxId, id: target.id });
			toastManager.add({ title: "Email sent!" });
			if (isDraftFolder) closePanel();
		} catch (err) {
			const message = (err instanceof Error ? err.message : null) || "Failed to send email.";
			toastManager.add({ title: message, variant: "error" });
		} finally { setIsSending(false); }
	};

	const hasThread = allMessages.length > 1;
	const timelineItems = buildSocialTimeline(
		allMessages,
		internalNotes,
		conversationEvents,
	);

	return (
		<div className="relative flex h-full flex-col">
			<EmailPanelToolbar
				email={email}
				mailboxId={mailboxId}
				isDraftFolder={isDraftFolder}
				isSending={isSending}
				moveToFolders={moveToFolders}
				onBack={closePanel}
				onSendDraft={() => handleSendDraft()}
				onEditDraft={() => handleEditDraft()}
				onReply={() =>
					startCompose({ mode: "reply", originalEmail: lastReceivedMessage })
				}
				onReplyAll={() =>
					startCompose({
						mode: "reply-all",
						originalEmail: lastReceivedMessage,
					})
				}
				onForward={() => startCompose({ mode: "forward", originalEmail: email })}
				onToggleStar={toggleStar}
				onToggleRead={() => {
					if (mailboxId) {
						updateEmail.mutate({
							mailboxId,
							id: email.id,
							data: { read: !email.read },
						});
					}
				}}
				onMove={handleMove}
				onViewSource={() => setSourceViewEmail(email)}
				onOpenAgent={() => setIsAgentOpen(true)}
				onDelete={handleDelete}
			/>

			<EmailPanelHeader
				subject={email.subject}
				messageCount={allMessages.length}
				showThreadCount={hasThread}
			/>

			<div className="flex flex-wrap items-center gap-1.5 border-b border-kumo-line px-4 py-2 text-xs text-kumo-subtle md:px-6">
				<span className="rounded-full bg-kumo-fill px-2 py-0.5">
					{conversationState.status}
				</span>
				<span className="rounded-full bg-kumo-fill px-2 py-0.5">
					{conversationState.priority}
				</span>
				{conversationState.needs_reply && (
					<span className="rounded-full bg-kumo-warning/10 px-2 py-0.5 text-kumo-warning">
						Needs reply
					</span>
				)}
				{conversationState.assignee_email && (
					<span className="rounded-full bg-kumo-fill px-2 py-0.5">
						@{conversationState.assignee_email.split("@")[0]}
					</span>
				)}
			</div>

			<div className="flex-1 overflow-y-auto pb-20 md:pb-0">
				{hasThread || internalNotes.length > 0 || conversationEvents.length > 0 ? (
					timelineItems.map((item, idx) => {
						if (item.type === "email") {
							const msg = item.email;
							const isDraft = draftMessageIds.has(msg.id);
							return (
								<ThreadMessage
									key={`email:${msg.id}`}
									email={msg}
									mailboxId={mailboxId}
									mailboxEmail={currentMailbox?.email}
									avatarVersions={avatarVersions}
									isLast={idx === timelineItems.length - 1}
									isDraft={isDraft}
									isSending={isDraft ? isSending : false}
									isExpanded={expandedMessages.has(msg.id)}
									onToggleExpand={() => toggleExpand(msg.id)}
									onSendDraft={isDraft ? () => handleSendDraft(msg) : undefined}
									onEditDraft={isDraft ? () => handleEditDraft(msg) : undefined}
									onDeleteDraft={isDraft ? () => handleDeleteDraft(msg) : undefined}
									onViewSource={() => setSourceViewEmail(msg)}
									onPreviewImage={(url, filename) =>
										setPreviewImage({ url, filename })
									}
								/>
							);
						}
						return <SocialTimelineItem key={item.id} item={item} />;
					})
				) : (
					<SingleMessageView
						email={email}
						mailboxId={mailboxId}
						mailboxEmail={currentMailbox?.email}
						avatarVersions={avatarVersions}
						onPreviewImage={(url, filename) =>
							setPreviewImage({ url, filename })
						}
					/>
				)}
			</div>

			{isNoteOpen && (
				<div className="border-t border-kumo-line bg-kumo-base px-4 py-3">
					<textarea
						className="h-24 w-full resize-none rounded-lg border border-kumo-line bg-kumo-base p-3 text-sm text-kumo-default outline-none focus:border-kumo-brand"
						value={noteBody}
						placeholder="Internal note"
						onChange={(event) => setNoteBody(event.target.value)}
					/>
					<div className="mt-2 flex justify-end gap-2">
						<Button variant="ghost" size="sm" onClick={() => setIsNoteOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="sm"
							icon={<NotePencilIcon size={14} />}
							onClick={handleCreateNote}
							loading={createInternalNote.isPending}
							disabled={!noteBody.trim()}
						>
							Save
						</Button>
					</div>
				</div>
			)}

			<div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-kumo-line bg-kumo-base/95 px-3 py-2 backdrop-blur md:hidden">
				<Button
					variant="primary"
					size="sm"
					icon={<ArrowBendUpLeftIcon size={16} />}
					onClick={() => startCompose({ mode: "reply", originalEmail: lastReceivedMessage })}
					className="flex-1"
				>
					Reply
				</Button>
				<Button
					variant="secondary"
					size="sm"
					icon={<NotePencilIcon size={16} />}
					onClick={() => setIsNoteOpen((open) => !open)}
					className="flex-1"
				>
					Note
				</Button>
				<Button
					variant="secondary"
					size="sm"
					icon={<RobotIcon size={16} />}
					onClick={() => setIsAgentOpen(true)}
					className="flex-1"
				>
					AI
				</Button>
			</div>

			{isAgentOpen && (
				<div className="fixed inset-0 z-50 flex justify-end bg-black/20 md:absolute md:bg-transparent">
					<div className="flex h-full w-full flex-col border-l border-kumo-line bg-kumo-base shadow-xl md:w-[380px]">
						<div className="flex items-center justify-between border-b border-kumo-line px-3 py-2">
							<div className="flex items-center gap-2 text-sm font-semibold text-kumo-strong">
								<RobotIcon size={16} />
								<span>AI Agent</span>
							</div>
							<Button
								variant="ghost"
								shape="square"
								size="sm"
								icon={<XIcon size={18} />}
								onClick={() => setIsAgentOpen(false)}
								aria-label="Close AI agent"
							/>
						</div>
						<div className="min-h-0 flex-1">
							<AgentSidebar />
						</div>
					</div>
				</div>
			)}

			<EmailPanelDialogs
				sourceViewEmail={sourceViewEmail}
				previewImage={previewImage}
				onCloseSource={() => setSourceViewEmail(null)}
				onClosePreview={() => setPreviewImage(null)}
			/>
		</div>
	);
}

type SocialTimelineItem =
	| { type: "email"; id: string; date: string; email: Email }
	| { type: "note"; id: string; date: string; note: InternalNote }
	| { type: "event"; id: string; date: string; event: ConversationEvent };

function buildSocialTimeline(
	emails: Email[],
	notes: InternalNote[],
	events: ConversationEvent[],
): SocialTimelineItem[] {
	return [
		...emails.map((email) => ({
			type: "email" as const,
			id: `email:${email.id}`,
			date: email.date,
			email,
		})),
		...notes.map((note) => ({
			type: "note" as const,
			id: `note:${note.id}`,
			date: note.created_at,
			note,
		})),
		...events
			.filter((event) => event.type !== "note_created")
			.map((event) => ({
				type: "event" as const,
				id: `event:${event.id}`,
				date: event.created_at,
				event,
			})),
	].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function SocialTimelineItem({ item }: { item: Exclude<SocialTimelineItem, { type: "email" }> }) {
	if (item.type === "note") {
		return (
			<div className="border-b border-kumo-line px-4 py-3 md:px-6">
				<div className="rounded-lg border border-kumo-line bg-kumo-tint px-3 py-2">
					<div className="mb-1 flex items-center gap-2 text-xs text-kumo-subtle">
						<NotePencilIcon size={14} />
						<span>{item.note.author_email}</span>
						<span className="ml-auto">{formatDetailDate(item.note.created_at)}</span>
					</div>
					<p className="text-sm text-kumo-default">{item.note.body}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="border-b border-kumo-line px-4 py-2 md:px-6">
			<div className="flex items-center gap-2 text-xs text-kumo-subtle">
				<ChatCircleTextIcon size={14} />
				<span className="font-medium text-kumo-default">
					{item.event.type.replaceAll("_", " ")}
				</span>
				{item.event.actor_email && <span>by {item.event.actor_email}</span>}
				<span className="ml-auto">{formatDetailDate(item.event.created_at)}</span>
			</div>
		</div>
	);
}
