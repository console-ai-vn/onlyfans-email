import { Button, Input, Loader } from "@cloudflare/kumo"
import { CheckIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useState, useCallback } from "react"

const STEPS = [
	{ id: "profile", label: "Profile", description: "Set your display name and bio" },
	{ id: "pricing", label: "Pricing", description: "Choose your subscription tier" },
	{ id: "first-post", label: "First Post", description: "Create your first content post" },
] as const

type StepId = (typeof STEPS)[number]["id"]

interface ProfileData {
	displayName: string
	bio: string
	avatarBase64?: string
}

interface PricingData {
	tier: string
	keyPrice: number
}

interface FirstPostData {
	title: string
	content: string
}

interface OnboardingWizardProps {
	onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
	const [currentStep, setCurrentStep] = useState<number>(0)
	const [loading, setLoading] = useState(false)

	// Profile state
	const [displayName, setDisplayName] = useState("")
	const [bio, setBio] = useState("")
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

	// Pricing state
	const [tier, setTier] = useState("basic")
	const [keyPrice, setKeyPrice] = useState(50000)

	// First post state
	const [postTitle, setPostTitle] = useState("")
	const [postContent, setPostContent] = useState("")

	const [error, setError] = useState<string | null>(null)

	const step = STEPS[currentStep]
	const isLast = currentStep === STEPS.length - 1

	const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onloadend = () => {
			setAvatarPreview(reader.result as string)
		}
		reader.readAsDataURL(file)
	}, [])

	const handleNext = useCallback(async () => {
		setError(null)
		setLoading(true)
		try {
			const stepId = STEPS[currentStep].id

			if (stepId === "profile") {
				await fetch("/api/v1/mailboxes/me", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						settings: {
							fromName: displayName || undefined,
							bio: bio || undefined,
						},
					}),
				})
				if (avatarPreview) {
					const base64 = avatarPreview.split(",")[1]
					await fetch("/api/v1/mailboxes/me/avatar", {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							content: base64,
							type: avatarPreview.split(";")[0]?.split(":")[1] || "image/jpeg",
						}),
					})
				}
			} else if (stepId === "pricing") {
				await fetch("/api/v1/mailboxes/me", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						settings: {
							subscriptionTier: tier,
							keyPrice: keyPrice,
						},
					}),
				})
			} else if (stepId === "first-post") {
				if (postTitle) {
					await fetch("/api/v1/home/topics", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							title: postTitle,
							body: postContent,
						}),
					})
				}
			}

			if (isLast) {
				onComplete()
			} else {
				setCurrentStep((prev) => prev + 1)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong")
		} finally {
			setLoading(false)
		}
	}, [currentStep, isLast, displayName, bio, avatarPreview, tier, keyPrice, postTitle, postContent, onComplete])

	const handleSkip = useCallback(() => {
		if (isLast) {
			onComplete()
		} else {
			setCurrentStep((prev) => prev + 1)
		}
	}, [isLast, onComplete])

	return (
		<div className="mx-auto max-w-lg rounded-2xl border border-kumo-line bg-kumo-base p-6 shadow-lg">
			{/* Progress indicator */}
			<div className="mb-6 flex items-center gap-2">
				{STEPS.map((s, i) => (
					<div key={s.id} className="flex items-center gap-2">
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
								i < currentStep
									? "bg-kumo-brand text-white"
									: i === currentStep
										? "bg-kumo-brand text-white ring-4 ring-kumo-brand/20"
										: "bg-kumo-fill text-kumo-subtle"
							}`}
						>
							{i < currentStep ? (
								<CheckIcon size={14} weight="bold" />
							) : (
								i + 1
							)}
						</div>
						{i < STEPS.length - 1 && (
							<div
								className={`h-px w-6 ${
									i < currentStep ? "bg-kumo-brand" : "bg-kumo-line"
								}`}
							/>
						)}
					</div>
				))}
				<span className="ml-auto text-xs font-medium text-kumo-subtle">
					Step {currentStep + 1} of {STEPS.length}
				</span>
			</div>

			{/* Step content */}
			<div className="mb-6">
				<h2 className="text-lg font-bold text-kumo-default">{step.label}</h2>
				<p className="mt-1 text-sm text-kumo-subtle">{step.description}</p>
			</div>

			{error && (
				<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{/* Step 1: Profile */}
			{step.id === "profile" && (
				<div className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Display Name
						</label>
						<Input
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder="Your creator name"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Bio
						</label>
						<textarea
							value={bio}
							onChange={(e) => setBio(e.target.value)}
							placeholder="Tell your audience about yourself..."
							rows={4}
							className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand"
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Avatar
						</label>
						<div className="flex items-center gap-4">
							<div className="size-16 overflow-hidden rounded-full border border-kumo-line bg-kumo-fill">
								{avatarPreview ? (
									<img
										src={avatarPreview}
										alt="Preview"
										className="size-full object-cover"
									/>
								) : (
									<div className="flex size-full items-center justify-center text-xs text-kumo-subtle">
										Avatar
									</div>
								)}
							</div>
							<label className="cursor-pointer rounded-lg border border-kumo-line bg-kumo-base px-3 py-2 text-sm text-kumo-default transition hover:bg-kumo-recessed">
								Upload
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleAvatarChange}
								/>
							</label>
						</div>
					</div>
				</div>
			)}

			{/* Step 2: Pricing */}
			{step.id === "pricing" && (
				<div className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Subscription Tier
						</label>
						<div className="grid grid-cols-3 gap-2">
							{["basic", "pro", "premium"].map((t) => (
								<button
									type="button"
									key={t}
									onClick={() => setTier(t)}
									className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-all ${
										tier === t
											? "border-kumo-brand bg-kumo-brand/10 text-kumo-brand ring-1 ring-kumo-brand"
											: "border-kumo-line bg-kumo-base text-kumo-subtle hover:border-kumo-brand/50"
									}`}
								>
									{t}
								</button>
							))}
						</div>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Key Price (VND)
						</label>
						<Input
							type="number"
							value={String(keyPrice)}
							onChange={(e) => setKeyPrice(Number(e.target.value) || 0)}
							placeholder="e.g. 50000"
						/>
						<p className="mt-1 text-xs text-kumo-subtle">
							Fans buy keys to unlock your pay-per-view content.
						</p>
					</div>
				</div>
			)}

			{/* Step 3: First Post */}
			{step.id === "first-post" && (
				<div className="space-y-4">
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Post Title
						</label>
						<Input
							value={postTitle}
							onChange={(e) => setPostTitle(e.target.value)}
							placeholder="My first post..."
						/>
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium text-kumo-default">
							Content
						</label>
						<textarea
							value={postContent}
							onChange={(e) => setPostContent(e.target.value)}
							placeholder="Share something with your audience..."
							rows={5}
							className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-1 focus:ring-kumo-brand"
						/>
					</div>
				</div>
			)}

			{/* Actions */}
			<div className="mt-6 flex items-center justify-between">
				<Button variant="secondary" size="sm" onClick={handleSkip}>
					{isLast ? "Finish" : "Skip"}
				</Button>
				<Button
					variant="primary"
					size="base"
					onClick={handleNext}
					disabled={loading}
				>
					{loading ? (
						<span className="inline-flex items-center gap-2">
							<Loader size="sm" />
							Saving…
						</span>
					) : (
						<span className="inline-flex items-center gap-1">
							{isLast ? "Complete" : "Next"}
							{!isLast && <CaretRightIcon size={16} weight="bold" />}
						</span>
					)}
				</Button>
			</div>
		</div>
	)
}
