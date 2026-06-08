import { useMemo } from "react";
import { useMailboxes } from "~/queries/mailboxes";
import type { Mailbox } from "~/types";

function indexMailboxMediaVersions(mailboxes: Mailbox[] | undefined) {
	const avatars = new Map<string, string>();
	const covers = new Map<string, string>();
	for (const mailbox of mailboxes ?? []) {
		const avatarVersion = mailbox.settings?.avatarUpdatedAt;
		const coverVersion = mailbox.settings?.coverUpdatedAt;
		for (const key of [mailbox.email, mailbox.id]) {
			const normalized = key.trim().toLowerCase();
			if (!normalized) continue;
			if (avatarVersion) avatars.set(normalized, avatarVersion);
			if (coverVersion) covers.set(normalized, coverVersion);
		}
	}
	return { avatars, covers };
}

export function useAvatarVersionMap() {
	const { data: mailboxes } = useMailboxes();
	return useMemo(
		() => indexMailboxMediaVersions(mailboxes).avatars,
		[mailboxes],
	);
}

export function useCoverVersionMap() {
	const { data: mailboxes } = useMailboxes();
	return useMemo(
		() => indexMailboxMediaVersions(mailboxes).covers,
		[mailboxes],
	);
}

export function getAvatarVersion(
	versions: Map<string, string>,
	email: string | undefined,
) {
	if (!email) return null;
	return versions.get(email.trim().toLowerCase()) ?? null;
}

export function getCoverVersion(
	versions: Map<string, string>,
	email: string | undefined,
) {
	if (!email) return null;
	return versions.get(email.trim().toLowerCase()) ?? null;
}