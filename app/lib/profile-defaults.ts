export function capitalizeLocalPart(email: string) {
	const local = email.split("@")[0] || "";
	const words = local
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
	return words.join(" ") || email;
}

export function domainFromEmail(email: string) {
	return email.split("@")[1]?.trim().toLowerCase() || "";
}

export function profileFieldDefaults(email: string) {
	const normalized = email.trim().toLowerCase();
	const fromName = capitalizeLocalPart(normalized);
	const domain = domainFromEmail(normalized);
	const orgLabel = domain ? domain.split(".")[0].toUpperCase() : "";

	return {
		fromName,
		department: orgLabel,
		website: domain,
		location: "Ho Chi Minh City",
	};
}