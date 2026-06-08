import { Button, Loader } from "@cloudflare/kumo";
import {
	EnvelopeSimpleIcon,
	MapPinIcon,
	PaperPlaneTiltIcon,
	XIcon,
} from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { useParams } from "react-router";
import MailboxAvatar from "~/components/MailboxAvatar";
import MailboxCover from "~/components/MailboxCover";
import {
	getAvatarVersion,
	getCoverVersion,
	useAvatarVersionMap,
	useCoverVersionMap,
} from "~/hooks/useAvatarVersions";
import { useMemberCompose } from "~/hooks/useMemberCompose";
import { useMailbox, useMailboxes } from "~/queries/mailboxes";
import type { Mailbox } from "~/types";

interface MemberProfileSheetProps {
	email: string;
	open: boolean;
	onClose: () => void;
	showFullBio?: boolean;
}

function mailboxDisplayName(mailbox: Mailbox) {
	return (
		mailbox.settings?.fromName?.trim() ||
		mailbox.name ||
		mailbox.email.split("@")[0] ||
		mailbox.email
	);
}

function fallbackMailbox(email: string): Mailbox {
	const normalized = email.trim().toLowerCase();
	return {
		id: normalized,
		email: normalized,
		name: normalized.split("@")[0] || normalized,
	};
}

function findMailboxByEmail(mailboxes: Mailbox[] | undefined, email: string) {
	const normalized = email.trim().toLowerCase();
	return mailboxes?.find(
		(mailbox) =>
			mailbox.email.toLowerCase() === normalized ||
			mailbox.id.toLowerCase() === normalized,
	);
}

export default function MemberProfileSheet({
	email,
	open,
	onClose,
	showFullBio = false,
}: MemberProfileSheetProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const openMemberCompose = useMemberCompose();
	const normalized = email.trim().toLowerCase();
	const activeMailboxId = decodeURIComponent(mailboxId ?? "")
		.trim()
		.toLowerCase();
	const avatarVersions = useAvatarVersionMap();
	const coverVersions = useCoverVersionMap();
	const { data: mailboxes } = useMailboxes();
	const cached = findMailboxByEmail(mailboxes, normalized);
	const {
		data: fetchedMailbox,
		isPending: fetchPending,
		isError,
	} = useMailbox(open ? normalized : undefined);
	const mailbox = fetchedMailbox ?? cached ?? (isError ? fallbackMailbox(normalized) : undefined);
	const settings = mailbox?.settings;
	const profileEmail = mailbox?.email ?? normalized;
	const avatarVersion =
		getAvatarVersion(avatarVersions, profileEmail) ??
		settings?.avatarUpdatedAt ??
		null;
	const coverVersion =
		getCoverVersion(coverVersions, profileEmail) ?? settings?.coverUpdatedAt ?? null;
	const isLoading = open && fetchPending && !mailbox;
	const bio = settings?.bio?.trim();
	const canMessage =
		!!activeMailboxId && activeMailboxId !== profileEmail.toLowerCase();

	if (!open) return null;

	const handleMessage = () => {
		openMemberCompose(profileEmail, onClose);
	};

	const sheet = (
		<div
			className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 md:items-center"
			onClick={onClose}
			onKeyDown={(e) => e.key === "Escape" && onClose()}
			role="presentation"
		>
			<div
				className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-kumo-line bg-kumo-base shadow-xl"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={`${mailbox ? mailboxDisplayName(mailbox) : normalized} profile`}
			>
				<div className="relative shrink-0">
					<MailboxCover
						email={profileEmail}
						coverVersion={coverVersion}
						className="h-28 w-full"
					/>
					<Button
						type="button"
						variant="ghost"
						shape="square"
						size="sm"
						className="absolute right-2 top-2 bg-kumo-base/80"
						icon={<XIcon size={16} />}
						onClick={onClose}
						aria-label="Close profile"
					/>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
					<div className="-mt-12 mb-3">
						<MailboxAvatar
							email={profileEmail}
							name={mailbox ? mailboxDisplayName(mailbox) : undefined}
							size="xl"
							variant="brand"
							avatarVersion={avatarVersion}
							className="ring-4 ring-kumo-base"
						/>
					</div>

					{isLoading ? (
						<div className="flex justify-center py-8">
							<Loader />
						</div>
					) : !mailbox ? (
						<p className="py-6 text-sm text-kumo-subtle">Could not load profile.</p>
					) : (
						<>
							<h2 className="text-lg font-semibold text-kumo-default">
								{mailboxDisplayName(mailbox)}
							</h2>
							{settings?.jobTitle && (
								<p className="mt-1 text-sm text-kumo-subtle">{settings.jobTitle}</p>
							)}
							<a
								href={`mailto:${mailbox.email}`}
								className="mt-1 inline-flex items-center gap-1.5 text-sm text-kumo-link hover:underline"
							>
								<EnvelopeSimpleIcon size={14} />
								{mailbox.email}
							</a>

							<div className="mt-4">
								<p className="text-xs font-medium uppercase tracking-wide text-kumo-subtle">
									Bio
								</p>
								{bio ? (
									<p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-kumo-strong">
										{bio}
									</p>
								) : (
									<p className="mt-1 text-sm italic text-kumo-subtle">
										{showFullBio
											? "No bio yet."
											: "This teammate has not added a bio."}
									</p>
								)}
							</div>

							{settings?.location && (
								<div className="mt-4 flex items-center gap-2 text-sm text-kumo-subtle">
									<MapPinIcon size={16} className="shrink-0" />
									<span>{settings.location}</span>
								</div>
							)}
						</>
					)}
				</div>

				{canMessage && !isLoading && (
					<div className="shrink-0 border-t border-kumo-line bg-kumo-base p-4">
						<Button
							variant="primary"
							size="sm"
							className="w-full"
							icon={<PaperPlaneTiltIcon size={16} />}
							onClick={handleMessage}
						>
							Send
						</Button>
					</div>
				)}
			</div>
		</div>
	);

	return typeof document !== "undefined"
		? createPortal(sheet, document.body)
		: sheet;
}