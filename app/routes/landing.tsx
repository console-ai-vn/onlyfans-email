import { Button } from "@cloudflare/kumo"
import {
	ArrowRightIcon,
	ArticleIcon,
	CaretDownIcon,
	CaretUpIcon,
	CurrencyCircleDollarIcon,
	LockKeyIcon,
	UsersIcon,
	EnvelopeIcon,
	LightningIcon,
	ShieldCheckIcon,
	SparkleIcon,
	ChartLineUpIcon,
} from "@phosphor-icons/react"
import { type FormEvent, useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import CreatorCard from "~/components/CreatorCard"
import PricingTable from "~/components/PricingTable"
import { useTopCreators } from "~/queries/creator"
import InstallBanner from "~/components/InstallBanner"
import type { CreatorCardData } from "~/components/CreatorCard"

export function meta() {
	return [
		{ title: "ONYX — Your Inbox, Your Empire" },
		{
			name: "description",
			content:
				"ONYX is the creator economy email platform. Monetize your content, own your audience, and build your empire — all from your inbox.",
		},
		{ property: "og:title", content: "ONYX — Creator Economy Email Platform" },
		{
			property: "og:description",
			content:
				"Monetize your content with ONYX. Email-based creator platform with content gating, PPV keys, and built-in payments.",
		},
		{ property: "og:image", content: "/favicon.svg" },
		{ property: "og:type", content: "website" },
		{ name: "twitter:card", content: "summary_large_image" },
	]
}

type SignupState = "idle" | "submitting" | "success" | "error"

function normalizeHandle(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9._-]/g, "")
		.replace(/^[._-]+/, "")
}

// ---- FAQ data ----
const FAQ_ITEMS = [
	{
		q: "What is ONYX?",
		a: "ONYX is the first email-based creator economy platform. Creators gate their content behind subscription or pay-per-view tiers, and fans get exclusive content delivered straight to their inbox. No app download needed — just email.",
	},
	{
		q: "How do subscriptions work?",
		a: "Fans choose a tier (Basic, Pro, or Premium), pay via VietQR, and immediately unlock subscriber-only content from their favorite creators. Subscriptions renew monthly and can be cancelled anytime.",
	},
	{
		q: "What are Keys?",
		a: "Keys are pay-per-view tokens fans can purchase to unlock individual pieces of premium content. Think of them as one-time passes. Keys never expire and can be used across any creator on ONYX.",
	},
	{
		q: "How do creators earn money?",
		a: "Creators set their subscription price and key prices. They keep 80% of subscription revenue and 85% of key sales. Payouts are processed weekly via VietQR to your bank account.",
	},
	{
		q: "Is my data secure?",
		a: "Yes. ONYX runs on Cloudflare's global infrastructure with enterprise-grade security. Content is encrypted in transit and at rest. We never share your personal data with third parties.",
	},
	{
		q: "Do I need a credit card?",
		a: "No — ONYX supports VietQR payments directly from your Vietnamese bank app. Simply scan the QR code with your banking app to complete payment. We also support Stripe for international cards.",
	},
]

export default function LandingRoute() {
	const navigate = useNavigate()
	const [displayName, setDisplayName] = useState("")
	const [personalEmail, setPersonalEmail] = useState("")
	const [handle, setHandle] = useState("")
	const [note, setNote] = useState("")
	const [status, setStatus] = useState<SignupState>("idle")
	const [error, setError] = useState("")
	const [openFaq, setOpenFaq] = useState<number | null>(null)

	const mailbox = useMemo(
		() =>
			`${normalizeHandle(handle || "nomad") || "nomad"}@onyx.com.vn`,
		[handle],
	)

	const { data: topCreators } = useTopCreators()

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
				const body = (await res.json().catch(() => ({}))) as { error?: string }
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

	const handlePricingSelect = useCallback(
		(tier: string) => {
			navigate(`/signup?tier=${tier}`)
		},
		[navigate],
	)

	const topCreatorCards: CreatorCardData[] =
		topCreators?.map((c) => ({
			id: c.id,
			name: c.name,
			avatarUrl: c.avatarUrl,
			coverUrl: c.coverUrl,
			bio: c.bio,
			subscriberCount: c.subscriberCount,
		})) ?? []

	return (
		<main className="min-h-screen bg-kumo-recessed">
			{/* ==================== HERO ==================== */}
			<section className="relative overflow-hidden">
				{/* Gradient background */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,124,255,0.25),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(30,214,160,0.15),transparent_35%),linear-gradient(135deg,#0a1020_0%,#111827_48%,#07111f_100%)]" />

				<div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 lg:py-32">
					{/* Nav */}
					<header className="mb-16 flex items-center justify-between">
						<a href="/" className="flex items-center gap-3 no-underline">
							<div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-sm font-black text-[#0a1020] shadow-xl shadow-blue-950/30">
								O
							</div>
							<div>
								<div className="text-sm font-semibold tracking-[0.2em] text-white/60">
									ONYX
								</div>
								<div className="text-xs text-white/45">Email Platform</div>
							</div>
						</a>
						<nav className="flex items-center gap-3">
							<a
								href="/pricing"
								className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/75 no-underline transition hover:border-white/35 hover:text-white sm:inline-flex"
							>
								Pricing
							</a>
							<a
								href="/signup"
								className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0a1020] no-underline shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5"
							>
								Get Started
							</a>
						</nav>
					</header>

					{/* Hero content */}
					<div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
						<div>
							<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-4 py-2 text-sm text-white/70 backdrop-blur">
								<SparkleIcon size={16} className="text-kumo-brand" />
								Creator Economy on Email
							</div>
							<h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
								Your inbox,
								<br />
								<span className="bg-gradient-to-r from-kumo-brand to-emerald-400 bg-clip-text text-transparent">
									your empire
								</span>
							</h1>
							<p className="mt-6 max-w-xl text-lg leading-8 text-white/60 md:text-xl">
								The first creator economy email platform. Gate your content
								behind subscriptions, sell access with Keys, and get paid
								instantly — all from your mailbox.
							</p>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row">
								<Button
									variant="primary"
									size="lg"
									onClick={() => navigate("/signup")}
								>
									Start Creating <ArrowRightIcon size={18} weight="bold" />
								</Button>
								<Button
									variant="outline"
									size="lg"
									onClick={() => navigate("/pricing")}
									className="border-white/15 text-white hover:bg-white/8"
								>
									View Pricing
								</Button>
							</div>

							{/* Trust badges */}
							<div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/40">
								<div className="flex items-center gap-1.5">
									<ShieldCheckIcon size={16} />
									<span>Secure payments</span>
								</div>
								<div className="flex items-center gap-1.5">
									<EnvelopeIcon size={16} />
									<span>No app install</span>
								</div>
								<div className="flex items-center gap-1.5">
									<LightningIcon size={16} />
									<span>Instant delivery</span>
								</div>
							</div>
						</div>

						{/* Hero visual */}
						<div className="hidden lg:block">
							<div className="rounded-2xl border border-white/10 bg-white/[0.06] p-1 shadow-2xl shadow-black/30 backdrop-blur-xl">
								<div className="rounded-xl bg-[#111827] p-6">
									<div className="flex items-center gap-3 border-b border-white/10 pb-4">
										<div className="size-10 rounded-full bg-gradient-to-br from-kumo-brand to-purple-500" />
										<div>
											<div className="text-sm font-semibold text-white">
												Creator Name
											</div>
											<div className="text-xs text-white/40">
												1.2K subscribers
											</div>
										</div>
									</div>
									<div className="mt-4 space-y-3">
										<div className="rounded-lg bg-white/[0.08] p-3">
											<div className="text-sm font-medium text-white">
												Exclusive Post
											</div>
											<div className="mt-1 text-xs text-white/40 line-clamp-2">
												Premium content available for subscribers only...
											</div>
											<div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
												<LockKeyIcon size={12} />
												Subscriber only
											</div>
										</div>
										<div className="rounded-lg bg-white/[0.08] p-3">
											<div className="text-sm font-medium text-white">
												BTS Photos
											</div>
											<div className="mt-1 text-xs text-white/40 line-clamp-2">
												Behind-the-scenes content from today's shoot...
											</div>
											<div className="mt-2 flex items-center gap-1 text-xs text-kumo-brand">
												<LockKeyIcon size={12} />
												1 Key to unlock
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ==================== FEATURES ==================== */}
			<section className="bg-kumo-base py-20">
				<div className="mx-auto max-w-7xl px-6 md:px-10">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-kumo-default md:text-4xl">
							Built for Creators
						</h2>
						<p className="mt-3 text-kumo-subtle">
							Everything you need to monetize your audience from one platform.
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{[
							{
								icon: EnvelopeIcon,
								title: "Email Platform",
								desc: "Own your audience. No algorithm, no platform risk. Direct to inbox with full control over your subscriber list and content delivery.",
							},
							{
								icon: LockKeyIcon,
								title: "Content Monetization",
								desc: "Gate content behind subscriptions or sell one-time access with Keys. Public, subscriber-only, and pay-per-view tiers built in.",
							},
							{
								icon: CurrencyCircleDollarIcon,
								title: "Payment System",
								desc: "Accept payments via VietQR or Stripe. Subscriptions, one-time purchases, and key sales — all handled automatically with instant payouts.",
							},
						].map(({ icon: Icon, title, desc }) => (
							<div
								key={title}
								className="group rounded-2xl border border-kumo-line bg-kumo-recessed p-6 transition-shadow hover:shadow-md"
							>
								<div className="mb-4 inline-flex rounded-xl bg-kumo-brand/10 p-3">
									<Icon
										size={24}
										className="text-kumo-brand"
										weight="duotone"
									/>
								</div>
								<h3 className="text-lg font-semibold text-kumo-default">
									{title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-kumo-subtle">{desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==================== HOW IT WORKS ==================== */}
			<section className="bg-kumo-recessed py-20">
				<div className="mx-auto max-w-5xl px-6 md:px-10">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-kumo-default md:text-4xl">
							How It Works
						</h2>
						<p className="mt-3 text-kumo-subtle">
							Three simple steps to start earning from your content.
						</p>
					</div>

					<div className="grid gap-8 md:grid-cols-3">
						{[
							{
								step: "01",
								title: "Create",
								icon: ArticleIcon,
								desc: "Set up your creator profile, write posts, upload media, and organize content into tiers — all from your mailbox.",
							},
							{
								step: "02",
								title: "Gate",
								icon: LockKeyIcon,
								desc: "Choose who sees what. Set content as public, subscriber-only, or pay-per-view with Keys that fans purchase to unlock.",
							},
							{
								step: "03",
								title: "Earn",
								icon: ChartLineUpIcon,
								desc: "Get paid weekly via VietQR. Track earnings, subscriber growth, and key sales from your creator dashboard.",
							},
						].map(({ step, title, icon: Icon, desc }) => (
							<div key={step} className="relative text-center">
								{/* Connector line between steps (desktop) */}
								<div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-kumo-brand/10">
									<Icon
										size={28}
										className="text-kumo-brand"
										weight="duotone"
									/>
								</div>
								<div className="text-xs font-bold tracking-[0.2em] text-kumo-brand uppercase">
									Step {step}
								</div>
								<h3 className="mt-2 text-xl font-bold text-kumo-default">
									{title}
								</h3>
								<p className="mt-2 text-sm leading-6 text-kumo-subtle">{desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==================== PRICING ==================== */}
			<section className="bg-kumo-base py-20">
				<div className="mx-auto max-w-5xl px-6 md:px-10">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-kumo-default md:text-4xl">
							Simple Pricing
						</h2>
						<p className="mt-3 text-kumo-subtle">
							Start free, upgrade when you grow. No hidden fees.
						</p>
					</div>
					<PricingTable onSelect={handlePricingSelect} />
				</div>
			</section>

			{/* ==================== CREATOR SHOWCASE ==================== */}
			{(topCreatorCards?.length ?? 0) > 0 && (
				<section className="bg-kumo-recessed py-20">
					<div className="mx-auto max-w-7xl px-6 md:px-10">
						<div className="mb-10 text-center">
							<h2 className="text-3xl font-bold text-kumo-default md:text-4xl">
								Top Creators
							</h2>
							<p className="mt-3 text-kumo-subtle">
								Discover the creators building empires on ONYX.
							</p>
						</div>
						<div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
							{topCreatorCards.map((c) => (
								<CreatorCard
									key={c.id}
									creator={c}
									onClick={() => navigate(`/${encodeURIComponent(c.id)}`)}
								/>
							))}
						</div>
					</div>
				</section>
			)}

			{/* ==================== FAQ ==================== */}
			<section className="bg-kumo-base py-20">
				<div className="mx-auto max-w-2xl px-6 md:px-10">
					<div className="mb-12 text-center">
						<h2 className="text-3xl font-bold text-kumo-default md:text-4xl">
							Frequently Asked
						</h2>
						<p className="mt-3 text-kumo-subtle">
							Everything you need to know about ONYX.
						</p>
					</div>

					<div className="space-y-3">
						{FAQ_ITEMS.map((item, i) => (
							<div
								key={i}
								className="rounded-xl border border-kumo-line bg-kumo-recessed"
							>
								<button
									type="button"
									onClick={() => setOpenFaq(openFaq === i ? null : i)}
									className="flex w-full items-center justify-between px-5 py-4 text-left"
								>
									<span className="text-sm font-semibold text-kumo-default">
										{item.q}
									</span>
									{openFaq === i ? (
										<CaretUpIcon size={18} className="text-kumo-subtle shrink-0" />
									) : (
										<CaretDownIcon size={18} className="text-kumo-subtle shrink-0" />
									)}
								</button>
								{openFaq === i && (
									<div className="border-t border-kumo-line px-5 pb-4 pt-3">
										<p className="text-sm leading-6 text-kumo-subtle">{item.a}</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ==================== SIGNUP ==================== */}
			<section id="signup" className="bg-kumo-recessed py-20">
				<div className="mx-auto max-w-4xl px-6 md:px-10">
					<div className="grid gap-8 rounded-3xl border border-kumo-line bg-kumo-base p-6 shadow-lg lg:grid-cols-[0.85fr_1.15fr] lg:p-10">
						<div className="flex flex-col justify-center">
							<h2 className="text-2xl font-bold text-kumo-default">
								Get Your ONYX Mailbox
							</h2>
							<p className="mt-3 text-sm leading-7 text-kumo-subtle">
								Fill out the form to request your @onyx.com.vn mailbox. Our
								team reviews and approves requests within 24 hours.
							</p>
							<div className="mt-6 rounded-2xl bg-kumo-recessed p-4 text-sm text-kumo-subtle">
								<div className="font-semibold text-kumo-default">How it works:</div>
								<ol className="mt-3 list-decimal space-y-2 pl-5">
									<li>Choose your mailbox handle (e.g., nomad@onyx.com.vn).</li>
									<li>Provide your personal email for notifications.</li>
									<li>Admin approves → you get login access.</li>
								</ol>
							</div>
						</div>

						<form
							onSubmit={submitSignup}
							className="rounded-2xl border border-kumo-line bg-kumo-recessed p-6"
						>
							<div className="grid gap-4 md:grid-cols-2">
								<label className="block">
									<span className="text-sm font-semibold text-kumo-default">
										Display Name
									</span>
									<input
										required
										value={displayName}
										onChange={(e) => setDisplayName(e.target.value)}
										placeholder="Nguyen Van A"
										className="mt-2 w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20"
									/>
								</label>
								<label className="block">
									<span className="text-sm font-semibold text-kumo-default">
										Personal Email
									</span>
									<input
										required
										type="email"
										value={personalEmail}
										onChange={(e) => setPersonalEmail(e.target.value)}
										placeholder="you@gmail.com"
										className="mt-2 w-full rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20"
									/>
								</label>
							</div>
							<label className="mt-4 block">
								<span className="text-sm font-semibold text-kumo-default">
									Desired Mailbox
								</span>
								<div className="mt-2 flex overflow-hidden rounded-xl border border-kumo-line bg-kumo-base focus-within:border-kumo-brand focus-within:ring-2 focus-within:ring-kumo-brand/20">
									<input
										required
										value={handle}
										onChange={(e) =>
											setHandle(normalizeHandle(e.target.value))
										}
										placeholder="nomad"
										className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none"
									/>
									<div className="border-l border-kumo-line bg-kumo-recessed px-4 py-3 text-sm font-semibold text-kumo-subtle">
										@onyx.com.vn
									</div>
								</div>
								<div className="mt-2 text-xs text-kumo-subtle">
									Preview: {mailbox}
								</div>
							</label>
							<label className="mt-4 block">
								<span className="text-sm font-semibold text-kumo-default">
									Note (optional)
								</span>
								<textarea
									value={note}
									onChange={(e) => setNote(e.target.value)}
									placeholder="Tell us about your use case..."
									rows={3}
									className="mt-2 w-full resize-none rounded-xl border border-kumo-line bg-kumo-base px-4 py-3 text-sm text-kumo-default placeholder-kumo-inactive outline-none transition focus:border-kumo-brand focus:ring-2 focus:ring-kumo-brand/20"
								/>
							</label>

							{status === "success" && (
								<div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
									Request submitted! We'll email you once approved. In the
									meantime, check out our{" "}
									<a
										href="/pricing"
										className="underline decoration-emerald-300"
									>
										pricing
									</a>
									.
								</div>
							)}
							{status === "error" && (
								<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={status === "submitting"}
								className="mt-5 w-full rounded-xl bg-kumo-brand px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
							>
								{status === "submitting" ? "Submitting..." : "Request Access"}
							</button>
						</form>
					</div>
				</div>
			</section>

			{/* ==================== INSTALL APP CTA ==================== */}
			<section className="bg-kumo-recessed py-12 md:hidden">
				<div className="mx-auto max-w-md px-6 text-center">
					<div className="rounded-2xl border border-kumo-line bg-kumo-base p-6">
						<InstallBanner />
						<p className="mt-4 text-xs text-kumo-subtle">
							Install ONYX for a full-screen experience with quick access from
							your home screen.
						</p>
					</div>
				</div>
			</section>

			{/* ==================== FOOTER ==================== */}
			<footer className="border-t border-kumo-line bg-kumo-base">
				<div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
					<div className="grid gap-8 md:grid-cols-4">
						<div>
							<div className="flex items-center gap-2">
								<div className="grid h-8 w-8 place-items-center rounded-lg bg-kumo-brand text-xs font-bold text-white">
									O
								</div>
								<span className="text-sm font-semibold text-kumo-default">
									ONYX
								</span>
							</div>
							<p className="mt-3 text-sm text-kumo-subtle">
								Creator economy on email. Own your audience, monetize your
								content.
							</p>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-kumo-default">
								Product
							</h4>
							<ul className="mt-3 space-y-2 text-sm text-kumo-subtle">
								<li>
									<a href="/pricing" className="hover:text-kumo-default">
										Pricing
									</a>
								</li>
								<li>
									<a href="#features" className="hover:text-kumo-default">
										Features
									</a>
								</li>
								<li>
									<a href="#faq" className="hover:text-kumo-default">
										FAQ
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-kumo-default">
								Company
							</h4>
							<ul className="mt-3 space-y-2 text-sm text-kumo-subtle">
								<li>
									<a href="#" className="hover:text-kumo-default">
										About
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-kumo-default">
										Blog
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-kumo-default">
										Contact
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="text-sm font-semibold text-kumo-default">
								Legal
							</h4>
							<ul className="mt-3 space-y-2 text-sm text-kumo-subtle">
								<li>
									<a href="#" className="hover:text-kumo-default">
										Privacy Policy
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-kumo-default">
										Terms of Service
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-10 border-t border-kumo-line pt-6 text-center text-sm text-kumo-subtle">
						&copy; {new Date().getFullYear()} ONYX. All rights reserved.
					</div>
				</div>
			</footer>

			{/* Structured data for SEO */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Organization",
						name: "ONYX",
						url: "https://start.onyx.com.vn",
						logo: "https://start.onyx.com.vn/favicon.svg",
						description:
							"Creator economy email platform for content monetization, subscriptions, and pay-per-view access.",
						founder: {
							"@type": "Person",
							name: "Thái Hiếu",
						},
						sameAs: [],
					}),
				}}
			/>
		</main>
	)
}
