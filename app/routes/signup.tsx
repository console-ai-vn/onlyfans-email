import { type FormEvent, useMemo, useState } from "react"
import { useNavigate } from "react-router"

export function meta() {
	return [
		{ title: "ONYX - Sign Up" },
		{
			name: "description",
			content: "Sign up for ONYX Internal Social Mail. Connect your team inbox.",
		},
	]
}

type SignupState = "idle" | "submitting" | "success" | "error"

function normalizeHandle(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^[._-]+/, "")
}

export default function SignupRoute() {
	const navigate = useNavigate()
	const [displayName, setDisplayName] = useState("")
	const [personalEmail, setPersonalEmail] = useState("")
	const [handle, setHandle] = useState("")
	const [note, setNote] = useState("")
	const [status, setStatus] = useState<SignupState>("idle")
	const [error, setError] = useState("")
	const mailbox = useMemo(
		() => `${normalizeHandle(handle || "nomad") || "nomad"}@onyx.com.vn`,
		[handle],
	)

	async function submitSignup(e: FormEvent<HTMLFormElement>) {
		e.preventDefault()
		setStatus("submitting")
		setError("")
		try {
			const res = await fetch("/api/public/signup-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					displayName,
					personalEmail,
					desiredMailbox: mailbox,
					note,
				}),
			})
			if (!res.ok) {
				const body = await res.json().catch(() => ({})) as { error?: string }
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
				err instanceof Error ? err.message : "Failed to submit signup request",
			)
		}
	}

	function handleCheckout() {
		navigate(`/checkout?mailboxId=${encodeURIComponent(mailbox)}`)
	}

	return (
		<main className="min-h-screen overflow-hidden bg-[#0a1020] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(64,120,255,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(30,214,160,0.18),transparent_30%),linear-gradient(135deg,#0a1020_0%,#111827_48%,#07111f_100%)]" />
			<div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 md:px-10">
				{/* Header */}
				<header className="flex items-center justify-between py-4">
					<a href="/" className="text-xl font-bold tracking-tight">
						<span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
							ONYX
						</span>
						<span className="ml-1 text-sm font-normal text-gray-400">Email</span>
					</a>
					<a
						href="/pricing"
						className="text-sm text-gray-400 transition-colors hover:text-white"
					>
						Pricing
					</a>
				</header>

				{/* Signup form */}
				<div className="flex flex-1 flex-col items-center justify-center pb-20">
					<div className="w-full max-w-md">
						<div className="mb-8 text-center">
							<h1 className="text-3xl font-bold">Request Access</h1>
							<p className="mt-2 text-gray-400">
								Get your @onyx.com.vn mailbox. We&apos;ll review and approve your
								request.
							</p>
						</div>

						{status === "success" ? (
							<div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
								<div className="mb-6 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
										<svg
											className="h-8 w-8 text-emerald-400"
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
									<h2 className="text-xl font-semibold">Request Submitted!</h2>
									<p className="mt-2 text-sm text-gray-400">
										Your mailbox {mailbox} will be ready shortly after review.
										Meanwhile, choose a plan to get started immediately.
									</p>
								</div>
								<button
									type="button"
									onClick={handleCheckout}
									className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
								>
									Choose Your Plan
								</button>
								<button
									type="button"
									onClick={() => navigate("/")}
									className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-gray-400 transition-colors hover:text-white"
								>
									Back to Home
								</button>
							</div>
						) : (
							<form
								onSubmit={submitSignup}
								className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
							>
								{status === "error" && (
									<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
										{error}
									</div>
								)}
								<div className="space-y-4">
									<div>
										<label
											htmlFor="displayName"
											className="mb-1 block text-sm font-medium text-gray-300"
										>
											Display Name
										</label>
										<input
											id="displayName"
											type="text"
											required
											value={displayName}
											onChange={(e) => setDisplayName(e.target.value)}
											placeholder="Nguyen Van A"
											className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
										/>
									</div>
									<div>
										<label
											htmlFor="personalEmail"
											className="mb-1 block text-sm font-medium text-gray-300"
										>
											Personal Email
										</label>
										<input
											id="personalEmail"
											type="email"
											required
											value={personalEmail}
											onChange={(e) => setPersonalEmail(e.target.value)}
											placeholder="you@gmail.com"
											className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
										/>
									</div>
									<div>
										<label
											htmlFor="handle"
											className="mb-1 block text-sm font-medium text-gray-300"
										>
											Desired Mailbox
										</label>
										<div className="flex items-center rounded-xl border border-white/10 bg-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30">
											<input
												id="handle"
												type="text"
												required
												value={handle}
												onChange={(e) =>
													setHandle(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))
												}
												placeholder="nguyenvana"
												className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none"
											/>
											<span className="pr-4 text-sm text-gray-400">
												@onyx.com.vn
											</span>
										</div>
									</div>
									<div>
										<label
											htmlFor="note"
											className="mb-1 block text-sm font-medium text-gray-300"
										>
											Note (optional)
										</label>
										<textarea
											id="note"
											value={note}
											onChange={(e) => setNote(e.target.value)}
											placeholder="Tell us about yourself..."
											rows={3}
											className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
										/>
									</div>
								</div>
								<button
									type="submit"
									disabled={status === "submitting"}
									className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
								>
									{status === "submitting" ? "Submitting..." : "Request Access"}
								</button>
							</form>
						)}
					</div>
				</div>
			</div>
		</main>
	)
}
