import { Button, Input, Loader, useKumoToastManager } from "@cloudflare/kumo";
import {
	BriefcaseIcon,
	BuildingsIcon,
	CameraIcon,
	FloppyDiskIcon,
	LinkIcon,
	MapPinIcon,
	PhoneIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import MailboxAvatar from "~/components/MailboxAvatar";
import MailboxCover from "~/components/MailboxCover";
import { profileFieldDefaults } from "~/lib/profile-defaults";
import {
	useMailbox,
	useUpdateMailbox,
	useUploadMailboxAvatar,
	useUploadMailboxCover,
} from "~/queries/mailboxes";
import { queryKeys } from "~/queries/keys";
import api from "~/services/api";
import type { MailboxSettings, SignatureSettings } from "~/types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function validateImage(file: File, maxMb: number) {
	if (!IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
		return "Use JPEG, PNG, or WebP";
	}
	if (file.size > maxMb * 1024 * 1024) {
		return `Image must be ${maxMb}MB or smaller`;
	}
	return null;
}

function emptyLabel(value: string, fallback = "Not set") {
	return value.trim() || fallback;
}

function SettingsPreviewRow({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: string;
}) {
	return (
		<div className="flex items-start gap-2 text-sm">
			<span className="mt-0.5 shrink-0 text-kumo-subtle">{icon}</span>
			<div className="min-w-0">
				<p className="text-xs font-medium uppercase tracking-wide text-kumo-subtle">
					{label}
				</p>
				<p className={value ? "text-kumo-default" : "text-kumo-subtle italic"}>
					{emptyLabel(value)}
				</p>
			</div>
		</div>
	);
}

export default function SettingsRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toastManager = useKumoToastManager();
	const { data: mailbox } = useMailbox(mailboxId);
	const updateMailbox = useUpdateMailbox();
	const uploadAvatar = useUploadMailboxAvatar();
	const uploadCover = useUploadMailboxCover();
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const coverInputRef = useRef<HTMLInputElement>(null);

	const [displayName, setDisplayName] = useState("");
	const [jobTitle, setJobTitle] = useState("");
	const [department, setDepartment] = useState("");
	const [phone, setPhone] = useState("");
	const [bio, setBio] = useState("");
	const [location, setLocation] = useState("");
	const [website, setWebsite] = useState("");
	const [signatureEnabled, setSignatureEnabled] = useState(false);
	const [signatureText, setSignatureText] = useState("");
	const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
	const [autoReplySubject, setAutoReplySubject] = useState("");
	const [autoReplyMessage, setAutoReplyMessage] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [avatarVersion, setAvatarVersion] = useState<string | null>(null);
	const [coverVersion, setCoverVersion] = useState<string | null>(null);
	const [isPublicBoard, setIsPublicBoard] = useState(false);
	const [boardName, setBoardName] = useState("");
	const [boardDescription, setBoardDescription] = useState("");
	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
	});
	const isAdmin = config?.isAdmin ?? false;

	useEffect(() => {
		if (!mailbox) return;
		const defaults = profileFieldDefaults(mailbox.email);
		const settings = mailbox.settings;

		setDisplayName(settings?.fromName?.trim() || defaults.fromName);
		setJobTitle(settings?.jobTitle?.trim() || "");
		setDepartment(settings?.department?.trim() || defaults.department);
		setPhone(settings?.phone?.trim() || "");
		setBio(settings?.bio?.trim() || "");
		setLocation(settings?.location?.trim() || defaults.location);
		setWebsite(settings?.website?.trim() || defaults.website);
		setSignatureEnabled(settings?.signature?.enabled ?? false);
		setSignatureText(settings?.signature?.text?.trim() || "");
		setAutoReplyEnabled(settings?.autoReply?.enabled ?? false);
		setAutoReplySubject(settings?.autoReply?.subject?.trim() || "");
		setAutoReplyMessage(settings?.autoReply?.message?.trim() || "");
		setAvatarVersion(settings?.avatarUpdatedAt ?? null);
		setCoverVersion(settings?.coverUpdatedAt ?? null);
		setIsPublicBoard(settings?.isPublicBoard === true);
		setBoardName(settings?.boardName?.trim() || defaults.fromName);
		setBoardDescription(settings?.boardDescription?.trim() || "");
	}, [mailbox]);

	const handleSave = async () => {
		if (!mailbox || !mailboxId) return;
		setIsSaving(true);

		const signature: SignatureSettings = {
			enabled: signatureEnabled,
			text: signatureText.trim(),
		};
		const settings: MailboxSettings = {
			...mailbox.settings,
			fromName: displayName.trim() || mailbox.name,
			jobTitle: jobTitle.trim() || undefined,
			department: department.trim() || undefined,
			phone: phone.trim() || undefined,
			bio: bio.trim() || undefined,
			location: location.trim() || undefined,
			website: website.trim() || undefined,
			signature,
			autoReply: {
				enabled: autoReplyEnabled,
				subject: autoReplySubject.trim(),
				message: autoReplyMessage.trim(),
			},
			...(isAdmin
				? {
						isPublicBoard,
						boardName: boardName.trim() || displayName.trim() || mailbox.name,
						boardDescription: boardDescription.trim() || undefined,
					}
				: {}),
		};

		try {
			await updateMailbox.mutateAsync({ mailboxId, settings });
			toastManager.add({ title: "Profile saved" });
		} catch {
			toastManager.add({ title: "Failed to save profile", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	const handleImagePick = async (
		file: File | undefined,
		kind: "avatar" | "cover",
	) => {
		if (!mailboxId || !file) return;
		const maxMb = kind === "avatar" ? 2 : 4;
		const validationError = validateImage(file, maxMb);
		if (validationError) {
			toastManager.add({ title: validationError, variant: "error" });
			return;
		}
		try {
			if (kind === "avatar") {
				const result = await uploadAvatar.mutateAsync({ mailboxId, file });
				setAvatarVersion(result.avatarUpdatedAt);
				toastManager.add({ title: "Profile photo updated" });
			} else {
				const result = await uploadCover.mutateAsync({ mailboxId, file });
				setCoverVersion(result.coverUpdatedAt);
				toastManager.add({ title: "Cover photo updated" });
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to upload photo";
			toastManager.add({ title: message, variant: "error" });
		} finally {
			const inputRef = kind === "avatar" ? avatarInputRef : coverInputRef;
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	if (!mailbox) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	return (
		<div className="h-full overflow-y-auto bg-kumo-recessed">
			<div className="mx-auto max-w-2xl">
				<button
					type="button"
					onClick={() => coverInputRef.current?.click()}
					disabled={uploadCover.isPending}
					className="group relative block h-36 w-full md:h-44"
					aria-label="Change cover photo"
				>
					<MailboxCover
						email={mailbox.email}
						coverVersion={coverVersion}
						className="h-full w-full"
					/>
					<span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
						<span className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
							<CameraIcon size={18} />
							{uploadCover.isPending ? "Uploading..." : "Change cover"}
						</span>
					</span>
				</button>
				<input
					ref={coverInputRef}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="hidden"
					onChange={(e) => void handleImagePick(e.target.files?.[0], "cover")}
				/>

				<div className="relative px-4 pb-8 md:px-8">
					<div className="-mt-14 mb-4 flex items-end justify-between gap-3">
						<button
							type="button"
							onClick={() => avatarInputRef.current?.click()}
							disabled={uploadAvatar.isPending}
							className="group relative shrink-0 rounded-full border-4 border-kumo-base shadow-md focus:outline-none focus:ring-2 focus:ring-kumo-ring disabled:opacity-70"
							aria-label="Change profile photo"
						>
							<MailboxAvatar
								email={mailbox.email}
								name={displayName}
								size="xl"
								variant="brand"
								avatarVersion={avatarVersion}
								className="border-0"
							/>
							<span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
								<CameraIcon size={28} className="text-white" />
							</span>
						</button>
						<input
							ref={avatarInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp"
							className="hidden"
							onChange={(e) => void handleImagePick(e.target.files?.[0], "avatar")}
						/>
						<Button
							variant="primary"
							size="sm"
							icon={<FloppyDiskIcon size={16} />}
							onClick={handleSave}
							loading={isSaving}
						>
							Save profile
						</Button>
					</div>

					<div className="rounded-xl border border-kumo-line bg-kumo-base p-5 shadow-sm">
						<h1 className="text-2xl font-bold text-kumo-default">
							{displayName || mailbox.email.split("@")[0]}
						</h1>
						<p className="text-sm text-kumo-subtle">{mailbox.email}</p>
						{(jobTitle || department) && (
							<p className="mt-1 text-sm text-kumo-default">
								{[jobTitle, department].filter(Boolean).join(" · ")}
							</p>
						)}

						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							<SettingsPreviewRow
								icon={<BriefcaseIcon size={16} />}
								label="Role"
								value={jobTitle}
							/>
							<SettingsPreviewRow
								icon={<BuildingsIcon size={16} />}
								label="Team"
								value={department}
							/>
							<SettingsPreviewRow
								icon={<MapPinIcon size={16} />}
								label="Location"
								value={location}
							/>
							<SettingsPreviewRow
								icon={<PhoneIcon size={16} />}
								label="Phone"
								value={phone}
							/>
							<SettingsPreviewRow
								icon={<LinkIcon size={16} />}
								label="Website"
								value={website}
							/>
						</div>

						<div className="mt-4">
							<p className="text-xs font-medium uppercase tracking-wide text-kumo-subtle">
								Bio
							</p>
							<p
								className={`mt-1 text-sm leading-relaxed ${
									bio ? "text-kumo-default" : "text-kumo-subtle italic"
								}`}
							>
								{emptyLabel(bio, "Add a short intro for teammates.")}
							</p>
						</div>
					</div>

					<div className="mt-6 space-y-6">
						<section className="space-y-4 rounded-xl border border-kumo-line bg-kumo-base p-5">
							<div>
								<h2 className="text-sm font-semibold text-kumo-default">
									Profile
								</h2>
								<p className="text-xs text-kumo-subtle">
									Visible to teammates in feed, inbox, and profile sheets.
								</p>
							</div>
							<Input
								label="Display name"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="How you appear when sending mail"
							/>
							<Input
								label="Role / job title"
								value={jobTitle}
								onChange={(e) => setJobTitle(e.target.value)}
								placeholder="Marketing Lead"
							/>
							<Input
								label="Team / department"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								placeholder="Marketing"
							/>
							<label className="block space-y-1.5">
								<span className="text-sm font-medium text-kumo-default">Bio</span>
								<textarea
									className="min-h-24 w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder="Short intro — role, team, what you do"
								/>
							</label>
							<Input
								label="Location"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="Ho Chi Minh City"
							/>
							<Input
								label="Phone"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+84 ..."
							/>
							<Input
								label="Website"
								value={website}
								onChange={(e) => setWebsite(e.target.value)}
								placeholder="vsbg.vn"
							/>
							<Input label="Email" type="email" value={mailbox.email} disabled />
						</section>

						<section className="space-y-4 rounded-xl border border-kumo-line bg-kumo-base p-5">
							<div>
								<h2 className="text-sm font-semibold text-kumo-default">Mail</h2>
								<p className="text-xs text-kumo-subtle">
									Signature and auto-reply apply when you send from this mailbox.
								</p>
							</div>
							<label className="flex items-center gap-2 text-sm text-kumo-default">
								<input
									type="checkbox"
									checked={signatureEnabled}
									onChange={(e) => setSignatureEnabled(e.target.checked)}
								/>
								Enable email signature
							</label>
							<label className="block space-y-1.5">
								<span className="text-sm font-medium text-kumo-default">
									Signature
								</span>
								<textarea
									className="min-h-20 w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring"
									value={signatureText}
									onChange={(e) => setSignatureText(e.target.value)}
									placeholder="Best regards,&#10;Marketing Team"
								/>
							</label>
							<label className="flex items-center gap-2 text-sm text-kumo-default">
								<input
									type="checkbox"
									checked={autoReplyEnabled}
									onChange={(e) => setAutoReplyEnabled(e.target.checked)}
								/>
								Enable auto-reply
							</label>
							<Input
								label="Auto-reply subject"
								value={autoReplySubject}
								onChange={(e) => setAutoReplySubject(e.target.value)}
								placeholder="Out of office"
							/>
							<label className="block space-y-1.5">
								<span className="text-sm font-medium text-kumo-default">
									Auto-reply message
								</span>
								<textarea
									className="min-h-20 w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring"
									value={autoReplyMessage}
									onChange={(e) => setAutoReplyMessage(e.target.value)}
									placeholder="Thanks for your email. We will get back to you soon."
								/>
							</label>
						</section>

						{isAdmin && (
							<section className="space-y-4 rounded-xl border border-kumo-line bg-kumo-base p-5">
								<div>
									<h2 className="text-sm font-semibold text-kumo-default">
										Board
									</h2>
									<p className="text-xs text-kumo-subtle">
										Public board settings for curated forum mailboxes.
									</p>
								</div>
								<label className="flex items-center gap-2 text-sm text-kumo-default">
									<input
										type="checkbox"
										checked={isPublicBoard}
										onChange={(e) => setIsPublicBoard(e.target.checked)}
									/>
									Public board (curated forum)
								</label>
								<Input
									label="Board name"
									value={boardName}
									onChange={(e) => setBoardName(e.target.value)}
									placeholder="Marketing"
								/>
								<label className="block space-y-1.5">
									<span className="text-sm font-medium text-kumo-default">
										Board description
									</span>
									<textarea
										className="min-h-20 w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring"
										value={boardDescription}
										onChange={(e) => setBoardDescription(e.target.value)}
										placeholder="What this board is for"
									/>
								</label>
							</section>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}