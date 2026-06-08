import { useEffect, useState } from "react";

interface MailboxCoverProps {
	email: string;
	coverVersion?: string | null;
	className?: string;
}

export default function MailboxCover({
	email,
	coverVersion,
	className = "",
}: MailboxCoverProps) {
	const mailboxEmail = email.trim().toLowerCase();
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		setImageFailed(false);
	}, [mailboxEmail, coverVersion]);

	const versionQuery = coverVersion ? `?v=${encodeURIComponent(coverVersion)}` : "";
	const src = `/api/v1/mailboxes/${encodeURIComponent(mailboxEmail)}/cover${versionQuery}`;

	return (
		<div
			className={`relative overflow-hidden bg-gradient-to-r from-kumo-brand/80 to-kumo-brand/40 ${className}`}
		>
			{!imageFailed && (
				<img
					src={src}
					alt=""
					className="absolute inset-0 size-full object-cover"
					onError={() => setImageFailed(true)}
				/>
			)}
		</div>
	);
}