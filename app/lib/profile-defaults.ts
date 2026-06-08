export function capitalizeLocalPart(email: string) {
	const local = email.split("@")[0] || "";
	const words = local
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
	return words.join(" ") || email;
}

export function profileFieldDefaults(email: string) {
	const normalized = email.trim().toLowerCase();
	return {
		fromName: capitalizeLocalPart(normalized),
		location: "Ho Chi Minh City",
	};
}