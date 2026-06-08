// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import {
	ArrowBendUpLeftIcon,
	EnvelopeOpenIcon,
	EnvelopeSimpleIcon,
	RobotIcon,
	StarIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { formatListDate } from "shared/dates";
import MailboxAvatar from "~/components/MailboxAvatar";
import { getAvatarVersion, useAvatarVersionMap } from "~/hooks/useAvatarVersions";
import { getSnippetText } from "~/lib/utils";
import type { Email } from "~/types";

function formatParticipants(email: Email): string {
	if (email.contact_display_name) return email.contact_display_name;
	if (email.participants) {
		const names = email.participants
			.split(",")
			.map((p) => p.trim().split("@")[0])
			.filter((name, idx, arr) => arr.indexOf(name) === idx);
		if (names.length <= 3) return names.join(", ");
		return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
	}
	return email.sender.split("@")[0];
}

function contactHandle(email: Email): string {
	const value = email.contact_email || email.sender;
	return value.split("@")[0];
}

function contactTags(email: Email): string[] {
	return (email.contact_tags ?? "")
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean)
		.slice(0, 3);
}

function hasUnread(email: Email): boolean {
	if (email.thread_unread_count !== undefined) return email.thread_unread_count > 0;
	return !email.read;
}

function FeedAvatar({ email }: { email: Email }) {
	const avatarVersions = useAvatarVersionMap();
	const participantEmail = (email.contact_email || email.sender).trim().toLowerCase();
	const participantName = email.contact_display_name || participantEmail;
	const avatarVersion = getAvatarVersion(avatarVersions, participantEmail);
	return (
		<MailboxAvatar
			email={participantEmail}
			name={participantName}
			size="lg"
			variant="brand"
			avatarVersion={avatarVersion}
		/>
	);
}

function StateChip({ label, tone }: { label: string; tone?: "warn" | "strong" | "ai" }) {
	return (
		<span
			className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
				tone === "warn"
					? "bg-kumo-warning/10 text-kumo-warning"
					: tone === "strong"
						? "bg-kumo-brand/10 text-kumo-brand"
						: tone === "ai"
							? "bg-kumo-info-tint text-kumo-link"
							: "bg-kumo-fill text-kumo-subtle"
			}`}
		>
			{label}
		</span>
	);
}

function nextActionFor(email: Email, needsReply: boolean) {
	if (needsReply) return "AI reply";
	if (email.priority === "high") return "AI brief";
	if (email.status === "waiting") return "Follow up";
	if (email.contact_memory || email.contact_description) return "Summarize";
	return "Profile";
}

interface MobileSocialInboxCardProps {
	email: Email;
	isSelected: boolean;
	isPanelOpen: boolean;
	onOpen: (email: Email) => void;
	onToggleStar: (event: React.MouseEvent, email: Email) => void;
	onToggleRead: (event: React.MouseEvent, email: Email) => void;
	onDelete: (event: React.MouseEvent, emailId: string) => void;
}

export default function MobileSocialInboxCard({
	email,
	isSelected,
	isPanelOpen,
	onOpen,
	onToggleStar,
	onToggleRead,
	onDelete,
}: MobileSocialInboxCardProps) {
	const snippet = getSnippetText(email.snippet);
	const unread = hasUnread(email);
	const stateNeedsReply = email.state_needs_reply ?? email.needs_reply;
	const tags = contactTags(email);
	const relationshipStage = email.contact_relationship_stage || email.status;
	const contextLine = email.contact_memory || email.contact_bio || email.contact_description;
	const nextAction = nextActionFor(email, !!stateNeedsReply);

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onOpen(email)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onOpen(email);
				}
			}}
			className={`group flex items-start gap-3 w-full rounded-xl border text-left cursor-pointer transition-colors px-4 py-3.5 ${
				isPanelOpen ? "md:px-3 md:py-3" : ""
			} ${isSelected ? "border-kumo-brand bg-kumo-tint" : "border-kumo-line bg-kumo-base hover:bg-kumo-tint"}`}
		>
			<div className="w-2.5 shrink-0 flex justify-center pt-4">
				{unread && <div className="h-2 w-2 rounded-full bg-kumo-brand" />}
			</div>

			<FeedAvatar email={email} />

			<div className="min-w-0 flex-1">
				<div className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<span
								className={`truncate text-sm ${unread ? "font-semibold text-kumo-default" : "text-kumo-strong"}`}
							>
								{formatParticipants(email)}
							</span>
							{relationshipStage && relationshipStage !== "open" && (
								<StateChip
									label={relationshipStage}
									tone={relationshipStage === "waiting" ? "warn" : undefined}
								/>
							)}
						</div>
						<p className="mt-0.5 truncate text-xs text-kumo-subtle">
							@{contactHandle(email)}
							{email.contact_relationship ? ` · ${email.contact_relationship}` : ""}
						</p>
					</div>
					{(email.thread_count ?? 1) > 1 && (
						<StateChip label={String(email.thread_count)} />
					)}
					<span className="text-sm text-kumo-subtle shrink-0 ml-auto">
						{formatListDate(email.date)}
					</span>
				</div>

				{contextLine && (
					<p className="mt-2 line-clamp-2 text-sm leading-5 text-kumo-default">
						{getSnippetText(contextLine, 120)}
					</p>
				)}

				<div className="truncate text-sm mt-0.5">
					<span className={unread ? "font-medium text-kumo-default" : "text-kumo-subtle"}>
						{email.subject}
					</span>
				</div>

				<div className="mt-2 flex flex-wrap gap-1.5">
					{tags.map((tag) => (
						<StateChip key={tag} label={`#${tag}`} />
					))}
					{email.priority === "high" && <StateChip label="High" tone="strong" />}
					{email.has_draft && <StateChip label="Draft" tone="warn" />}
					{stateNeedsReply && !email.has_draft && (
						<Tooltip content="Needs reply" asChild>
							<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kumo-warning/10 px-2 py-0.5 text-xs font-medium text-kumo-warning">
								<ArrowBendUpLeftIcon size={13} weight="bold" />
								Reply
							</span>
						</Tooltip>
					)}
					{email.assignee_email && (
						<StateChip label={`@${email.assignee_email.split("@")[0]}`} />
					)}
					<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-kumo-info-tint px-2 py-0.5 text-xs font-medium text-kumo-link">
						<RobotIcon size={13} />
						{nextAction}
					</span>
				</div>

				{snippet && (
					<p className="mt-1.5 line-clamp-2 text-xs leading-5 text-kumo-subtle">
						{snippet}
					</p>
				)}

				<div className="mt-3 flex gap-1 md:hidden">
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<StarIcon size={14} weight={email.starred ? "fill" : "regular"} />}
						onClick={(e) => onToggleStar(e, email)}
						aria-label={email.starred ? "Unstar" : "Star"}
					/>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={email.read ? <EnvelopeSimpleIcon size={14} /> : <EnvelopeOpenIcon size={14} />}
						onClick={(e) => onToggleRead(e, email)}
						aria-label={email.read ? "Mark unread" : "Mark read"}
					/>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<TrashIcon size={14} />}
						onClick={(e) => onDelete(e, email.id)}
						aria-label="Delete"
					/>
				</div>
			</div>

			<div className="hidden group-hover:flex items-center shrink-0 pt-1">
				<Tooltip content={email.starred ? "Unstar" : "Star"} asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<StarIcon size={14} weight={email.starred ? "fill" : "regular"} />}
						onClick={(e) => onToggleStar(e, email)}
						aria-label={email.starred ? "Unstar" : "Star"}
					/>
				</Tooltip>
				<Tooltip content={email.read ? "Mark unread" : "Mark read"} asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={email.read ? <EnvelopeSimpleIcon size={14} /> : <EnvelopeOpenIcon size={14} />}
						onClick={(e) => onToggleRead(e, email)}
						aria-label={email.read ? "Mark unread" : "Mark read"}
					/>
				</Tooltip>
				<Tooltip content="Delete" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<TrashIcon size={14} />}
						onClick={(e) => onDelete(e, email.id)}
						aria-label="Delete"
					/>
				</Tooltip>
			</div>
		</div>
	);
}
