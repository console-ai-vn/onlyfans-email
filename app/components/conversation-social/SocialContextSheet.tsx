// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button } from "@cloudflare/kumo";
import { FloppyDiskIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import ConversationStateControls from "~/components/conversation-social/ConversationStateControls";
import { useContactProfile, useUpdateContactProfile } from "~/queries/emails";
import type { ConversationEvent, ConversationState, Email, InternalNote } from "~/types";

interface SocialContextSheetProps {
	open: boolean;
	mailboxId?: string;
	email: Email;
	state?: ConversationState;
	notes: InternalNote[];
	events: ConversationEvent[];
	isSaving?: boolean;
	onClose: () => void;
	onStateChange: (patch: Partial<ConversationState>) => void;
}

const EMPTY_PROFILE = {
	display_name: "",
	bio: "",
	contact_description: "",
	relationship: "",
	relationship_stage: "",
	tags: "",
	memory: "",
	location: "",
	website: "",
};

const RELATIONSHIP_STAGES = ["new", "warm", "active", "waiting", "closed"];

function participantNames(email: Email) {
	const raw = email.participants || [email.sender, email.recipient, email.cc]
		.filter(Boolean)
		.join(",");
	return raw
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.slice(0, 8);
}

function emailAddressFrom(value?: string | null) {
	const match = value?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	return match?.[0]?.toLowerCase() ?? null;
}

function initialsFor(value?: string | null) {
	const name = value?.trim();
	if (!name) return "?";
	return name
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

function tagsFrom(value?: string | null) {
	return (value ?? "")
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean)
		.slice(0, 5);
}

function formatShortDate(value?: string | null) {
	if (!value) return "Never";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Never";
	return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SocialContextSheet({
	open,
	mailboxId,
	email,
	state,
	notes,
	events,
	isSaving,
	onClose,
	onStateChange,
}: SocialContextSheetProps) {
	const participants = participantNames(email);
	const primaryEmail = useMemo(
		() => emailAddressFrom(email.sender) ?? emailAddressFrom(email.recipient),
		[email.sender, email.recipient],
	);
	const { data: contactProfile } = useContactProfile(mailboxId, primaryEmail);
	const updateContactProfile = useUpdateContactProfile();
	const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE);

	useEffect(() => {
		setProfileDraft({
			display_name: contactProfile?.display_name ?? "",
			bio: contactProfile?.bio ?? "",
			contact_description: contactProfile?.contact_description ?? "",
			relationship: contactProfile?.relationship ?? "",
			relationship_stage: contactProfile?.relationship_stage ?? "",
			tags: contactProfile?.tags ?? "",
			memory: contactProfile?.memory ?? "",
			location: contactProfile?.location ?? "",
			website: contactProfile?.website ?? "",
		});
	}, [contactProfile]);

	const saveProfile = async () => {
		if (!mailboxId || !primaryEmail) return;
		await updateContactProfile.mutateAsync({
			mailboxId,
			emailAddress: primaryEmail,
			profile: profileDraft,
		});
	};

	if (!open) return null;

	const displayName =
		profileDraft.display_name || primaryEmail?.split("@")[0] || "Unknown contact";
	const profileTags = tagsFrom(profileDraft.tags);
	const threadCount = contactProfile?.threads?.length ?? 0;

	return (
		<div className="fixed inset-0 z-50 md:absolute md:inset-y-0 md:right-0 md:left-auto md:w-80">
			<button
				type="button"
				className="absolute inset-0 bg-black/20 md:hidden"
				onClick={onClose}
				aria-label="Close context"
			/>
			<aside className="absolute inset-x-0 bottom-0 max-h-[82vh] rounded-t-xl border border-kumo-line bg-kumo-base shadow-xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:rounded-none md:border-y-0 md:border-r-0">
				<div className="flex items-center justify-between border-b border-kumo-line px-4 py-3">
					<div>
						<h3 className="text-sm font-semibold text-kumo-default">Context</h3>
						<p className="text-xs text-kumo-subtle">Thread controls and team activity</p>
					</div>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={16} />}
						onClick={onClose}
						aria-label="Close context"
					/>
				</div>

				<div className="space-y-5 overflow-y-auto px-4 py-4">
					<section className="space-y-2">
						<h4 className="text-xs font-semibold uppercase text-kumo-subtle">
							People
						</h4>
						<div className="flex flex-wrap gap-1.5">
							{participants.map((participant) => (
								<span
									key={participant}
									className="rounded-full bg-kumo-fill px-2 py-1 text-xs text-kumo-default"
								>
									{participant.split("@")[0]}
								</span>
							))}
						</div>
					</section>

					<section className="space-y-3 rounded-lg border border-kumo-line bg-kumo-tint p-3">
						<div className="flex items-start gap-3">
							<div className="grid size-12 shrink-0 place-items-center rounded-full bg-kumo-brand text-base font-semibold text-white">
								{initialsFor(profileDraft.display_name || primaryEmail)}
							</div>
							<div className="min-w-0 flex-1">
								<div className="flex items-start justify-between gap-2">
									<div className="min-w-0">
										<h4 className="truncate text-base font-semibold text-kumo-default">
											{displayName}
										</h4>
										<p className="truncate text-xs text-kumo-subtle">
											{primaryEmail ?? "Unknown contact"}
										</p>
									</div>
									<Button
										variant="primary"
										size="sm"
										icon={<FloppyDiskIcon size={14} />}
										onClick={saveProfile}
										loading={updateContactProfile.isPending}
										disabled={!mailboxId || !primaryEmail}
									>
										Save
									</Button>
								</div>
								{profileDraft.bio && (
									<p className="mt-2 text-sm leading-snug text-kumo-default">
										{profileDraft.bio}
									</p>
								)}
							</div>
						</div>

						<div className="grid grid-cols-3 gap-2">
							<div className="rounded-md bg-kumo-base px-2 py-2">
								<p className="text-[11px] font-medium uppercase text-kumo-subtle">Stage</p>
								<p className="truncate text-sm font-semibold text-kumo-default">
									{profileDraft.relationship_stage || "new"}
								</p>
							</div>
							<div className="rounded-md bg-kumo-base px-2 py-2">
								<p className="text-[11px] font-medium uppercase text-kumo-subtle">Threads</p>
								<p className="text-sm font-semibold text-kumo-default">{threadCount}</p>
							</div>
							<div className="rounded-md bg-kumo-base px-2 py-2">
								<p className="text-[11px] font-medium uppercase text-kumo-subtle">Last</p>
								<p className="truncate text-sm font-semibold text-kumo-default">
									{formatShortDate(contactProfile?.last_seen_at)}
								</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-1.5">
							{profileTags.length > 0 ? (
								profileTags.map((tag) => (
									<span
										key={tag}
										className="rounded-full bg-kumo-base px-2 py-1 text-xs font-medium text-kumo-default"
									>
										#{tag}
									</span>
								))
							) : (
								<span className="rounded-full bg-kumo-base px-2 py-1 text-xs text-kumo-subtle">
									no tags
								</span>
							)}
						</div>

						{profileDraft.memory && (
							<div className="rounded-md border border-kumo-line bg-kumo-base px-3 py-2">
								<div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-kumo-subtle">
									<SparkleIcon size={13} />
									Memory
								</div>
								<p className="text-sm leading-snug text-kumo-default">
									{profileDraft.memory}
								</p>
							</div>
						)}

						<div className="space-y-2">
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">Name</span>
								<input
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.display_name}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, display_name: event.target.value }))
									}
									placeholder="Display name"
								/>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">Stage</span>
								<select
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.relationship_stage}
									onChange={(event) =>
										setProfileDraft((draft) => ({
											...draft,
											relationship_stage: event.target.value,
										}))
									}
								>
									<option value="">new</option>
									{RELATIONSHIP_STAGES.map((stage) => (
										<option key={stage} value={stage}>
											{stage}
										</option>
									))}
								</select>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">Tags</span>
								<input
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.tags}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, tags: event.target.value }))
									}
									placeholder="client, vip, partner"
								/>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">Bio</span>
								<textarea
									className="h-16 w-full resize-none rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.bio}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, bio: event.target.value }))
									}
									placeholder="Who they are, role, context"
								/>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">AI memory</span>
								<textarea
									className="h-20 w-full resize-none rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.memory}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, memory: event.target.value }))
									}
									placeholder="What should AI remember about this person?"
								/>
							</label>
							<label className="block space-y-1">
								<span className="text-xs font-medium text-kumo-subtle">Contact note</span>
								<textarea
									className="h-20 w-full resize-none rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.contact_description}
									onChange={(event) =>
										setProfileDraft((draft) => ({
											...draft,
											contact_description: event.target.value,
										}))
									}
									placeholder="Private relationship context, preferences, follow-up notes"
								/>
							</label>
							<div className="grid grid-cols-1 gap-2">
								<input
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.relationship}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, relationship: event.target.value }))
									}
									placeholder="Relationship"
								/>
								<input
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.location}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, location: event.target.value }))
									}
									placeholder="Location"
								/>
								<input
									className="w-full rounded-md border border-kumo-line bg-kumo-base px-2.5 py-2 text-sm text-kumo-default outline-none focus:border-kumo-brand"
									value={profileDraft.website}
									onChange={(event) =>
										setProfileDraft((draft) => ({ ...draft, website: event.target.value }))
									}
									placeholder="Website / social link"
								/>
							</div>
						</div>
					</section>

					<section className="space-y-2">
						<h4 className="text-xs font-semibold uppercase text-kumo-subtle">
							State
						</h4>
						<ConversationStateControls
							state={state}
							disabled={isSaving}
							onChange={onStateChange}
						/>
					</section>

					<section className="space-y-2">
						<h4 className="text-xs font-semibold uppercase text-kumo-subtle">
							Notes
						</h4>
						{notes.length > 0 ? (
							<div className="space-y-2">
								{notes.slice(0, 4).map((note) => (
									<div
										key={note.id}
										className="rounded-lg border border-kumo-line bg-kumo-tint px-3 py-2"
									>
										<p className="text-sm text-kumo-default">{note.body}</p>
										<p className="mt-1 text-xs text-kumo-subtle">
											{note.author_email}
										</p>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-kumo-subtle">No internal notes yet.</p>
						)}
					</section>

					<section className="space-y-2 pb-4">
						<h4 className="text-xs font-semibold uppercase text-kumo-subtle">
							Activity
						</h4>
						<div className="space-y-2">
							{events.slice(0, 6).map((event) => (
								<div key={event.id} className="text-sm text-kumo-default">
									<span className="font-medium">{event.type.replaceAll("_", " ")}</span>
									{event.actor_email && (
										<span className="text-kumo-subtle"> by {event.actor_email}</span>
									)}
								</div>
							))}
							{events.length === 0 && (
								<p className="text-sm text-kumo-subtle">No activity yet.</p>
							)}
						</div>
					</section>
				</div>
			</aside>
		</div>
	);
}
