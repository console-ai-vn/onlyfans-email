import { useMemo } from "react";
import { useMailboxes } from "~/queries/mailboxes";

export function useAvatarVersionMap() {
	const { data: mailboxes } = useMailboxes();
	return useMemo(() => {
		const map = new Map<string, string>();
		for (const mailbox of mailboxes ?? []) {
			const version = mailbox.settings?.avatarUpdatedAt;
			if (version) map.set(mailbox.email.toLowerCase(), version);
		}
		return map;
	}, [mailboxes]);
}

export function getAvatarVersion(
	versions: Map<string, string>,
	email: string | undefined,
) {
	if (!email) return null;
	return versions.get(email.trim().toLowerCase()) ?? null;
}