import { roleHasPermission, type MailboxRole } from "./permissions";

export interface PublicMailboxSettings {
	fromName?: string;
	jobTitle?: string;
	department?: string;
	phone?: string;
	bio?: string;
	location?: string;
	website?: string;
	avatarUpdatedAt?: string;
	coverUpdatedAt?: string;
}

const OPERATIONAL_SETTING_KEYS = ["signature", "forwarding", "autoReply"] as const;

export function toPublicMailboxSettings(
	settings: Record<string, unknown> | undefined,
): PublicMailboxSettings {
	return {
		fromName: pickString(settings?.fromName) ?? undefined,
		jobTitle: pickString(settings?.jobTitle) ?? undefined,
		department: pickString(settings?.department) ?? undefined,
		phone: pickString(settings?.phone) ?? undefined,
		bio: pickString(settings?.bio) ?? undefined,
		location: pickString(settings?.location) ?? undefined,
		website: pickString(settings?.website) ?? undefined,
		avatarUpdatedAt: pickString(settings?.avatarUpdatedAt) ?? undefined,
		coverUpdatedAt: pickString(settings?.coverUpdatedAt) ?? undefined,
	};
}

export function toMailboxSettingsForRole(
	settings: Record<string, unknown> | undefined,
	role: MailboxRole | null,
	accessEmail: string,
	mailboxId: string,
) {
	if (!settings) return toPublicMailboxSettings(settings);
	if (
		role &&
		(roleHasPermission(role, "settings") ||
			normalize(accessEmail) === normalize(mailboxId))
	) {
		return settings;
	}

	const safe: Record<string, unknown> = {
		...toPublicMailboxSettings(settings),
	};
	if (role && roleHasPermission(role, "send")) {
		for (const key of OPERATIONAL_SETTING_KEYS) {
			if (key in settings) safe[key] = settings[key];
		}
	}
	return safe;
}

function normalize(value: string) {
	return value.trim().toLowerCase();
}

function pickString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed || null;
}