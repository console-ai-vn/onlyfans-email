import { Button, Input, Loader, useKumoToastManager } from "@cloudflare/kumo";
import {
	BriefcaseIcon,
	CameraIcon,
	CreditCardIcon,
	FloppyDiskIcon,
	MapPinIcon,
	ReceiptIcon,
	XIcon,
} from "@phosphor-icons/react";
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
import {
	useCancelSubscription,
	useInvoices,
	useSubscription,
} from "~/queries/payments";
import type { MailboxSettings } from "~/types";

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

	// Billing
	const { data: subData } = useSubscription(mailboxId);
	const subscription = subData?.subscription ?? null;
	const { data: invData } = useInvoices(mailboxId);
	const invoices = invData?.invoices ?? [];
	const cancelSubscription = useCancelSubscription(mailboxId!);
	const [cancelling, setCancelling] = useState(false);

	const [displayName, setDisplayName] = useState("");
	const [role, setRole] = useState("");
	const [bio, setBio] = useState("");
	const [location, setLocation] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [avatarVersion, setAvatarVersion] = useState<string | null>(null);
	const [coverVersion, setCoverVersion] = useState<string | null>(null);

	useEffect(() => {
		if (!mailbox) return;
		const defaults = profileFieldDefaults(mailbox.email);
		const settings = mailbox.settings;

		setDisplayName(settings?.fromName?.trim() || defaults.fromName);
		setRole(settings?.jobTitle?.trim() || "");
		setBio(settings?.bio?.trim() || "");
		setLocation(settings?.location?.trim() || defaults.location);
		setAvatarVersion(settings?.avatarUpdatedAt ?? null);
		setCoverVersion(settings?.coverUpdatedAt ?? null);
	}, [mailbox]);

	const handleSave = async () => {
		if (!mailbox || !mailboxId) return;
		setIsSaving(true);

		const settings: MailboxSettings = {
			...mailbox.settings,
			fromName: displayName.trim() || mailbox.name,
			jobTitle: role.trim() || undefined,
			bio: bio.trim() || undefined,
			location: location.trim() || undefined,
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
						{role && <p className="mt-1 text-sm text-kumo-default">{role}</p>}

						<div className="mt-5 grid gap-4 sm:grid-cols-2">
							<SettingsPreviewRow
								icon={<BriefcaseIcon size={16} />}
								label="Role"
								value={role}
							/>
							<SettingsPreviewRow
								icon={<MapPinIcon size={16} />}
								label="Location"
								value={location}
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

					<section className="mt-6 space-y-4 rounded-xl border border-kumo-line bg-kumo-base p-5">
						<div>
							<h2 className="text-sm font-semibold text-kumo-default">Profile</h2>
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
							label="Role"
							value={role}
							onChange={(e) => setRole(e.target.value)}
							placeholder="Marketing Lead"
						/>
						<label className="block space-y-1.5">
							<span className="text-sm font-medium text-kumo-default">Bio</span>
							<textarea
								className="min-h-24 w-full resize-y rounded-lg border border-kumo-line bg-kumo-recessed px-3 py-2 text-sm text-kumo-default placeholder:text-kumo-subtle focus:outline-none focus:ring-1 focus:ring-kumo-ring"
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								placeholder="Short intro — what you do"
							/>
						</label>
						<Input
							label="Location"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="Ho Chi Minh City"
						/>
						<Input label="Email" type="email" value={mailbox.email} disabled />
					</section>

					{/* Billing Section */}
					<section className="mt-6 rounded-xl border border-kumo-line bg-kumo-base p-5">
						<div className="mb-4 flex items-center gap-2">
							<CreditCardIcon size={18} className="text-kumo-subtle" />
							<h2 className="text-sm font-semibold text-kumo-default">Billing</h2>
						</div>

						{subscription ? (
							<div className="space-y-4">
								<div className="rounded-lg border border-kumo-line bg-kumo-recessed p-4">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-kumo-default capitalize">
												{subscription.tier} Plan
											</p>
											<p className="text-xs text-kumo-subtle">
												{new Intl.NumberFormat("vi-VN", {
													style: "currency",
													currency: "VND",
													maximumFractionDigits: 0,
												}).format(subscription.amount)}{" "}
												/ month
											</p>
										</div>
										<span
											className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
												subscription.status === "active"
													? "bg-emerald-100 text-emerald-700"
													: subscription.status === "past_due"
														? "bg-amber-100 text-amber-700"
														: subscription.status === "cancelled"
															? "bg-red-100 text-red-700"
															: "bg-gray-100 text-gray-700"
											}`}
										>
											{subscription.status.replace("_", " ")}
										</span>
									</div>
									<div className="mt-2 text-xs text-kumo-subtle">
										<p>
											Period:{" "}
											{new Date(subscription.currentPeriodStart).toLocaleDateString()}{" "}
											&mdash;{" "}
											{new Date(subscription.currentPeriodEnd).toLocaleDateString()}
										</p>
									</div>
								</div>

								{(subscription.status === "active" ||
									subscription.status === "past_due") && (
									<Button
										variant="secondary"
										size="sm"
										loading={cancelling}
										onClick={async () => {
											setCancelling(true)
											try {
												await cancelSubscription.mutateAsync()
												toastManager.add({
													title: "Subscription cancelled",
												})
											} catch {
												toastManager.add({
													title: "Failed to cancel subscription",
													variant: "error",
												})
											} finally {
												setCancelling(false)
											}
										}}
									>
										<XIcon size={14} className="mr-1" />
										Cancel Subscription
									</Button>
								)}
							</div>
						) : (
							<div className="rounded-lg border border-dashed border-kumo-line bg-kumo-recessed p-4 text-center">
								<p className="text-sm text-kumo-subtle">No active subscription</p>
							</div>
						)}

						{invoices.length > 0 && (
							<div className="mt-5">
								<div className="mb-2 flex items-center gap-1.5">
									<ReceiptIcon size={14} className="text-kumo-subtle" />
									<h3 className="text-xs font-medium text-kumo-subtle">
										Invoice History
									</h3>
								</div>
								<div className="space-y-1.5">
									{invoices.map((inv) => (
										<div
											key={inv.id}
											className="flex items-center justify-between rounded-md border border-kumo-line bg-kumo-recessed px-3 py-2 text-xs"
										>
											<div>
												<p className="text-kumo-default">
													{new Intl.NumberFormat("vi-VN", {
														style: "currency",
														currency: "VND",
														maximumFractionDigits: 0,
													}).format(inv.amount)}
												</p>
												<p className="text-kumo-subtle">
													{new Date(inv.createdAt).toLocaleDateString()} &middot;{" "}
													{inv.provider}
												</p>
											</div>
											<span
												className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
													inv.status === "paid"
														? "bg-emerald-100 text-emerald-700"
														: inv.status === "failed"
															? "bg-red-100 text-red-700"
															: "bg-gray-100 text-gray-700"
												}`}
											>
												{inv.status}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</section>
				</div>
			</div>
		</div>
	);
}