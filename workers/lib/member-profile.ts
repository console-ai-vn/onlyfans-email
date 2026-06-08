export interface PublicMemberProfile {
	email: string;
	displayName: string;
	bio: string | null;
	location: string | null;
	website: string | null;
	avatarUpdatedAt: string | null;
	coverUpdatedAt: string | null;
	hasAvatar: boolean;
	hasCover: boolean;
}

export function toPublicMemberProfile(
	email: string,
	settings: Record<string, unknown> | undefined,
	assets: { hasAvatar: boolean; hasCover: boolean },
): PublicMemberProfile {
	const fromName =
		typeof settings?.fromName === "string" ? settings.fromName.trim() : "";
	const localPart = email.split("@")[0] || email;

	return {
		email,
		displayName: fromName || localPart,
		bio: pickOptionalString(settings?.bio),
		location: pickOptionalString(settings?.location),
		website: pickOptionalString(settings?.website),
		avatarUpdatedAt: pickOptionalString(settings?.avatarUpdatedAt),
		coverUpdatedAt: pickOptionalString(settings?.coverUpdatedAt),
		hasAvatar: assets.hasAvatar,
		hasCover: assets.hasCover,
	};
}

function pickOptionalString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed || null;
}