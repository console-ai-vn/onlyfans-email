import { Button, Loader } from "@cloudflare/kumo";
import {
	EnvelopeSimpleIcon,
	MapPinIcon,
	PaperPlaneTiltIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import MailboxAvatar from "~/components/MailboxAvatar";
import MailboxCover from "~/components/MailboxCover";
import {
	getAvatarVersion,
	getCoverVersion,
	useAvatarVersionMap,
	useCoverVersionMap,
} from "~/hooks/useAvatarVersions";
import { useUIStore } from "~/hooks/useUIStore";
import { useMailbox, useMailboxes } from "~/queries/mailboxes";
import type { Mailbox } from "~/types";

interface MemberProfileSheetProps {
	email: string;
	open: boolean;
	onClose: () => void;
}

const BIO_PREVIEW_CHARS = 140;

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
}: MemberProfileSheetProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const { startCompose, closeSidebar } = useUIStore();
	const [bioExpanded, setBioExpanded] = useState(false);
	const normalized = email.trim().toLowerCase();
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
		getAvatarVersion(avatarVersions, profileEmail) ?? settings?.avatarUpdatedAt ?? null;
	const coverVersion =
		getCoverVersion(coverVersions, profileEmail) ?? settings?.coverUpdatedAt ?? null;
	const isLoading = open && fetchPending && !mailbox;
	const bio = settings?.bio?.trim();
	const bioNeedsExpand = !!bio && bio.length > BIO_PREVIEW_CHARS;

	useEffect(() => {
		setBioExpanded(false);
	}, [normalized, open]);

	if (!open) return null;

	const handleMessage = () => {
		if (!mailboxId) return;
		onClose();
		closeSidebar();
		navigate(`/mailbox/${mailboxId}/emails/inbox`);
		startCompose({ mode: "new", prefillTo: email.trim().toLowerCase() });
	};

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 md:items-center">
			<div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-kumo-line bg-kumo-base shadow-xl">
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

							{bio && (
								<div className="mt-4">
									<p
										className={`text-sm leading-relaxed text-kumo-strong whitespace-pre-wrap ${
											!bioExpanded && bioNeedsExpand ? "line-clamp-4" : ""
										}`}
									>
										{bio}
									</p>
									{bioNeedsExpand && (
										<button
											type="button"
											onClick={() => setBioExpanded((value) => !value)}
											className="mt-2 text-sm font-medium text-kumo-link hover:underline"
										>
											{bioExpanded ? "Show less" : "Show full bio"}
										</button>
									)}
								</div>
							)}

							<div className="mt-4 space-y-2 text-sm text-kumo-subtle">
								{settings?.location && (
									<div className="flex items-center gap-2">
										<MapPinIcon size={16} className="shrink-0" />
										<span>{settings.location}</span>
									</div>
								)}
							</div>

							{mailboxId && mailboxId.toLowerCase() !== mailbox.email.toLowerCase() && (
								<div className="mt-5">
									<Button
										variant="primary"
										size="sm"
										className="w-full"
										icon={<PaperPlaneTiltIcon size={16} />}
										onClick={handleMessage}
									>
										Send email
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}