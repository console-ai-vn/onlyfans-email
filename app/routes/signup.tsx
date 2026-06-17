import { type FormEvent, useMemo, useState, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router"

export function meta() {
	return [
		{ title: "ONYX — Sign Up" },
		{
			name: "description",
			content:
				"Create your ONYX creator account. Get your @onyx.com.vn mailbox and start monetizing your content today.",
		},
	]
}

type SignupState = "idle" | "submitting" | "success" | "error"

const STEPS = [
	{ id: "account", label: "Account", desc: "Your basic info" },
	{ id: "mailbox", label: "Mailbox", desc: "Choose your handle" },
	{ id: "confirm", label: "Confirm", desc: "Review & submit" },
] as const

function normalizeHandle(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^[._-]+/, "")
}

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

interface ValidationErrors {
	displayName?: string
	personalEmail?: string
	handle?: string
}

export default function SignupRoute() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const preselectedTier = searchParams.get("tier") || ""

	const [currentStep, setCurrentStep] = useState(0)
	const [displayName, setDisplayName] = useState("")
	const [personalEmail, setPersonalEmail] = useState("")
	const [handle, setHandle] = useState("")
	const [note, setNote] = useState("")
	const [status, setStatus] = useState<SignupState>("idle")
	const [error, setError] = useState("")
	const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

	const mailbox = useMemo(
		() => `${normalizeHandle(handle || "nomad") || "nomad"}@onyx.com.vn`,
		[handle],
	)

	const steps = STEPS
	const isLastStep = currentStep === steps.length - 1

	const validateStep = useCallback(
		(step: number): boolean => {
			const errors: ValidationErrors = {}
			if (step === 0) {
				if (!displayName.trim()) errors.displayName = "Display name is required"
				if (!personalEmail.trim())
					errors.personalEmail = "Email is required"
				else if (!isValidEmail(personalEmail))
					errors.personalEmail = "Enter a valid email address"
			}
			if (step === 1) {
				if (!handle.trim()) errors.handle = "Mailbox handle is required"
			}
			setValidationErrors(errors)
			return Object.keys(errors).length === 0
		},
		[displayName, personalEmail, handle],
	)

	const handleNext = useCallback(() => {
		if (validateStep(currentStep)) {
			setCurrentStep((prev) => prev + 1)
		}
	}, [currentStep, validateStep])

	const handleBack = useCallback(() => {
		setCurrentStep((prev) => Math.max(0, prev - 1))
	}, [])

	async function submitSignup(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setStatus("submitting")
		setError("")

		// Basic Turnstile check (if enabled)
		if (!turnstileToken) {
			// In dev mode, skip Turnstile
			if (!import.meta.env.DEV) {
				setStatus("error")
				setError("Please complete the security check")
				return
			}
		}

		try {
			const res = await fetch("/api/public/signup-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					displayName,
					personalEmail,
					desiredMailbox: mailbox,
					note,
					turnstileToken: turnstileToken || undefined,
				}),
			})
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as {
					error?: string
				}
				throw new Error(body.error || "Failed to submit signup request")
			}
			setStatus("success")
			setDisplayName("")
			setPersonalEmail("")
			setHandle("")
			setNote("")
		} catch (err) {
			setStatus("error")
			setError(
				err instanceof Error
					? err.message
					: "Failed to submit signup request",
			)
		}
	}

	function handleCheckout() {
		const params = new URLSearchParams()
		params.set("mailboxId", mailbox)
		if (preselectedTier) params.set("tier", preselectedTier)
		navigate(`/checkout?${params.toString()}`)
	}

	return (
		<main className="min-h-screen bg-kumo-recessed">
			{/* Header */}
			<header className="flex items-center justify-between border-b border-kumo-line bg-kumo-base px-6 py-4 md:px-10">
				<a href="/" className="flex items-center gap-3 no-underline">
					<div className="grid h-9 w-9 place-items-center rounded-xl bg-kumo-brand text-sm font-black text-white">
						O
					</div>
					<span className="text-lg font-bold text-kumo-default">ONYX</span>
				</a>
				<a
					href="/pricing"
					className="text-sm text-kumo-subtle transition-colors hover:text-kumo-default"
				>
					Pricing
				</a>
			</header>

			<div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
				<div className="w-full max-w-lg">
					{/* Step indicator */}
					{status !== "success" && (
						<div className="mb-10">
							<div className="flex items-center justify-center gap-1">
								{steps.map((s, i) => (
									<div key={s.id} className="flex items-center gap-1">
										<div
											className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
												i < currentStep
													? "bg-kumo-brand text-white"
													: i === currentStep
														? "bg-kumo-brand text-white ring-4 ring-kumo-brand/20"
														: "bg-kumo-fill text-kumo-subtle"
											}`}
										>
											{i < currentStep ? "✓" : i + 1}
										</div>
										{i < steps.length - 1 && (
											<div
												className={`h-px w-10 ${i < currentStep ? "bg-kumo-brand" : "bg-kumo-line"}`}
											/>
										)}
									</div>
								))}
							</div>
							<p className="mt-2 text-center text-xs text-kumo-subtle">
								Step {currentStep + 1} of {steps.length}:{" "}
								{steps[currentStep].desc}
							</p>
						</div>
					)}

					{/* Header */}
					<div className="mb-8 text-center">
						<h1 className="text-2xl font-bold text-kumo-default">
							{status === "success"
								? "Request Submitted!"
								: "Create Your Account"}
						</h1>
						<p className="mt-2 text-kumo-subtle">
							{status === "success"
								? "We'll review your request and get back to you within 24 hours."
								: "Get your @onyx.com.vn mailbox and start building your creator empire."}
						</p>
					</div>

					{/* Success state */}
					{status === "success" ? (
						<div className="rounded-2xl border border-kumo-line bg-kumo-base p-8 text-center shadow-lg">
							<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
								<svg
									className="size-8 text-emerald-500"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<title>Success checkmark</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h2 className="text-lg font-semibold text-kumo-default">
								All Set!
							</h2>
							<p className="mt-2 text-sm text-kumo-subtle">
								Your mailbox <strong className="text-kumo-default">{mailbox}</strong>{" "}
								will be ready after admin review. In the meantime, choose a
								plan to get started.
							</p>
							<div className="mt-6 space-y-3">
								<button
									type="button"
									onClick={handleCheckout}
									className="w-full rounded-xl bg-kumo-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
								>
									Choose Your Plan
								</button>
								<button
									type="button"
									onClick={() => navigate("/")}
									className="w-full rounded-xl border border-kumo-line bg-kumo-base px-6 py-3 text-sm text-kumo-subtle transition hover:bg-kumo-recessed"
								>
									Back to Home
								</button>
							</div>
						</div>
					) : (
						<form
							onSubmit={currentStep === 2 ? submitSignup : (e) => { e.preventDefault(); handleNext() }}
							className="rounded-2xl border border-kumo-line bg-kumo-base p-8 shadow-lg"
						>
							{/* Error banner */}
							{status === "error" && (
								<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{error}
								</div>
							)}

							{/* Step 0: Account Info */}
							{currentStep === 0 && (
								<div className="space-y-5">
									<div>
										<label
											htmlFor="displayName"
											className="mb-1 block text-sm font-medium text-kumo-default"
										>
											Display Name
										</label>
										<input
											id="displayName"
											type="text"
											required
											value={displayName}
											onChange={(e) => {
												setDisplayName(e.target.value)
												setValidationErrors((prev) => ({ ...prev, displayName: undefined }))
											}}
											placeholder="Your creator name"
											className={`w-full rounded-xl border bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20 ${
												validationErrors.displayName
													? "border-red-300"
													: "border-kumo-line"
											}`}
										/>
										{validationErrors.displayName && (
											<p className="mt-1 text-xs text-red-500">
												{validationErrors.displayName}
											</p>
										)}
									</div>

									<div>
										<label
											htmlFor="personalEmail"
											className="mb-1 block text-sm font-medium text-kumo-default"
										>
											Personal Email
										</label>
										<input
											id="personalEmail"
											type="email"
											required
											value={personalEmail}
											onChange={(e) => {
												setPersonalEmail(e.target.value)
												setValidationErrors((prev) => ({ ...prev, personalEmail: undefined }))
											}}
											placeholder="you@gmail.com"
											className={`w-full rounded-xl border bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20 ${
												validationErrors.personalEmail
													? "border-red-300"
													: "border-kumo-line"
											}`}
										/>
										{validationErrors.personalEmail && (
											<p className="mt-1 text-xs text-red-500">
												{validationErrors.personalEmail}
											</p>
										)}
										<p className="mt-1 text-xs text-kumo-inactive">
											This email is only used for account notifications. Your
											public identity is your @onyx.com.vn mailbox.
										</p>
									</div>
								</div>
							)}

							{/* Step 1: Mailbox */}
							{currentStep === 1 && (
								<div className="space-y-5">
									<div>
										<label
											htmlFor="handle"
											className="mb-1 block text-sm font-medium text-kumo-default"
										>
											Your Mailbox Handle
										</label>
										<div
											className={`flex items-center overflow-hidden rounded-xl border bg-kumo-base ${
												validationErrors.handle
													? "border-red-300"
													: "border-kumo-line focus-within:border-kumo-brand focus-within:ring-2 focus-within:ring-kumo-brand/20"
											}`}
										>
											<input
												id="handle"
												type="text"
												required
												value={handle}
												onChange={(e) => {
													setHandle(
														e.target.value.replace(
															/[^a-zA-Z0-9._-]/g,
															"",
														),
													)
													setValidationErrors((prev) => ({ ...prev, handle: undefined }))
												}}
												placeholder="yourname"
												className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none"
											/>
											<span className="shrink-0 border-l border-kumo-line bg-kumo-recessed px-4 py-3 text-sm text-kumo-subtle">
												@onyx.com.vn
											</span>
										</div>
										{validationErrors.handle && (
											<p className="mt-1 text-xs text-red-500">
												{validationErrors.handle}
											</p>
										)}
										<p className="mt-2 rounded-lg bg-kumo-recessed p-3 text-xs text-kumo-subtle">
											Preview:{" "}
											<strong className="text-kumo-default">{mailbox}</strong>{" "}
											— this becomes your public identity. Only letters,
											numbers, dots, underscores, and hyphens allowed.
										</p>
									</div>

									<div>
										<label
											htmlFor="note"
											className="mb-1 block text-sm font-medium text-kumo-default"
										>
											Note (optional)
										</label>
										<textarea
											id="note"
											value={note}
											onChange={(e) => setNote(e.target.value)}
											placeholder="Tell us about yourself and what you plan to create..."
											rows={3}
											className="w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20 resize-none"
										/>
									</div>
								</div>
							)}

							{/* Step 2: Review + Submit */}
							{currentStep === 2 && (
								<div className="space-y-4">
									<div className="rounded-xl border border-kumo-line bg-kumo-recessed p-4">
										<h3 className="text-sm font-semibold text-kumo-default">
											Review Your Info
										</h3>
										<div className="mt-3 space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-kumo-subtle">Display Name:</span>
												<span className="font-medium text-kumo-default">
													{displayName}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-kumo-subtle">Personal Email:</span>
												<span className="font-medium text-kumo-default break-all">
													{personalEmail}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-kumo-subtle">Mailbox:</span>
												<span className="font-medium text-kumo-brand">
													{mailbox}
												</span>
											</div>
										</div>
									</div>

									{/* Turnstile widget placeholder */}
									<div className="rounded-xl border border-kumo-line bg-kumo-recessed p-4">
										<div className="flex items-center gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-kumo-brand/10">
												<svg
													className="size-5 text-kumo-brand"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={2}
												>
													<title>Security</title>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
													/>
												</svg>
											</div>
											<div>
												<p className="text-sm font-medium text-kumo-default">
													Security Check
												</p>
												<p className="text-xs text-kumo-subtle">
													Cloudflare Turnstile verifies you're human. No CAPTCHA
													required.
												</p>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Navigation buttons */}
							<div
								className={`mt-8 flex items-center gap-3 ${currentStep > 0 ? "justify-between" : "justify-end"}`}
							>
								{currentStep > 0 && (
									<button
										type="button"
										onClick={handleBack}
										className="rounded-xl border border-kumo-line bg-kumo-base px-5 py-3 text-sm font-medium text-kumo-default transition hover:bg-kumo-recessed"
									>
										Back
									</button>
								)}

								<button
									type={currentStep === 2 ? "submit" : "button"}
									onClick={currentStep === 2 ? undefined : handleNext}
									disabled={status === "submitting"}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-kumo-brand px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
								>
									{status === "submitting"
										? "Submitting..."
										: currentStep === 2
											? "Submit Request"
											: `Continue to ${steps[currentStep + 1]?.label || ""}`}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</main>
	)
}
