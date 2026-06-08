import { useEffect, useState } from "react";

function initialsFor(name: string, email: string) {
	const source = name.trim() || email.split("@")[0] || "?";
	return source
		.split(/[\s._-]+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
}

function extractEmail(value: string) {
	const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
	return match?.[0]?.toLowerCase() ?? value.trim().toLowerCase();
}

interface MailboxAvatarProps {
	email: string;
	name?: string;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	avatarVersion?: string | null;
	variant?: "brand" | "muted" | "draft";
}

const SIZE_CLASS = {
	sm: "size-8 text-xs",
	md: "size-9 text-xs",
	lg: "size-12 text-base",
	xl: "size-28 text-3xl",
} as const;

export default function MailboxAvatar({
	email,
	name = "",
	size = "md",
	className = "",
	avatarVersion,
	variant = "muted",
}: MailboxAvatarProps) {
	const mailboxEmail = extractEmail(email);
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		setImageFailed(false);
	}, [mailboxEmail, avatarVersion]);

	const versionQuery = avatarVersion ? `?v=${encodeURIComponent(avatarVersion)}` : "";
	const src = `/api/v1/mailboxes/${encodeURIComponent(mailboxEmail)}/avatar${versionQuery}`;
	const showImage = !imageFailed;
	const label = initialsFor(name, mailboxEmail);
	const variantClass =
		variant === "brand"
			? "bg-kumo-brand text-white"
			: variant === "draft"
				? "bg-kumo-fill text-kumo-subtle"
				: "bg-kumo-fill text-kumo-default";

	return (
		<div
			className={`relative shrink-0 overflow-hidden rounded-full grid place-items-center font-bold ${SIZE_CLASS[size]} ${variantClass} ${className}`}
		>
			{showImage ? (
				<img
					src={src}
					alt=""
					className="absolute inset-0 size-full object-cover"
					onError={() => setImageFailed(true)}
				/>
			) : (
				<span>{variant === "draft" ? "D" : label}</span>
			)}
		</div>
	);
}