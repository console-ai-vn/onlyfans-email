import { useMemo, useState } from "react";
import MailboxAvatar from "~/components/MailboxAvatar";
import { getAvatarVersion, useAvatarVersionMap } from "~/hooks/useAvatarVersions";
import {
	resolveMemberDisplayName,
	useMemberDisplayNames,
} from "~/hooks/useMemberDisplayNames";
import { useMailboxes } from "~/queries/mailboxes";
import MemberProfileSheet from "./MemberProfileSheet";

interface MemberProfileTriggerProps {
	email: string;
	name?: string;
	avatarSize?: "sm" | "md" | "lg";
	showName?: boolean;
	nameClassName?: string;
	layout?: "row" | "avatar-only" | "name-only";
	showFullBio?: boolean;
}

function findMailboxSettingsAvatarVersion(
	mailboxes: ReturnType<typeof useMailboxes>["data"],
	email: string,
) {
	const normalized = email.trim().toLowerCase();
	const mailbox = mailboxes?.find(
		(entry) =>
			entry.email.toLowerCase() === normalized ||
			entry.id.toLowerCase() === normalized,
	);
	return mailbox?.settings?.avatarUpdatedAt ?? null;
}

export default function MemberProfileTrigger({
	email,
	name,
	avatarSize = "md",
	showName = true,
	nameClassName = "",
	layout = "row",
	showFullBio = true,
}: MemberProfileTriggerProps) {
	const [open, setOpen] = useState(false);
	const avatarVersions = useAvatarVersionMap();
	const displayNames = useMemberDisplayNames();
	const { data: mailboxes } = useMailboxes();
	const normalized = email.trim().toLowerCase();
	const displayName = resolveMemberDisplayName(displayNames, normalized, name);
	const avatarVersion = useMemo(
		() =>
			getAvatarVersion(avatarVersions, normalized) ??
			findMailboxSettingsAvatarVersion(mailboxes, normalized),
		[avatarVersions, mailboxes, normalized],
	);

	const openProfile = () => setOpen(true);

	const buttonClassName =
		layout === "row"
			? "flex min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:opacity-90"
			: layout === "name-only"
				? "max-w-full truncate rounded-md text-left transition-colors hover:text-kumo-brand"
				: "rounded-full ring-2 ring-transparent transition-all hover:ring-kumo-brand/30 hover:opacity-95";

	return (
		<>
			<button
				type="button"
				onClick={openProfile}
				className={buttonClassName}
				aria-label={`View ${displayName}'s profile`}
			>
				{layout !== "name-only" && (
					<MailboxAvatar
						email={normalized}
						name={displayName}
						size={avatarSize}
						variant="brand"
						avatarVersion={avatarVersion}
					/>
				)}
				{showName && (layout === "row" || layout === "name-only") && (
					<span className={`truncate text-sm font-medium text-kumo-default ${nameClassName}`}>
						{displayName}
					</span>
				)}
			</button>
			<MemberProfileSheet
				email={normalized}
				open={open}
				onClose={() => setOpen(false)}
				showFullBio={showFullBio}
			/>
		</>
	);
}