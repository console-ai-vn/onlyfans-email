import { Button } from "@cloudflare/kumo"
import { CheckIcon } from "@phosphor-icons/react"
import { useNavigate } from "react-router"
import TierCard from "~/components/TierCard"

export function meta() {
	return [
		{ title: "ONYX Email - Pricing" },
		{
			name: "description",
			content: "Choose the right plan for your team. Internal social mail with tiered features.",
		},
	]
}

const TIERS = [
	{
		name: "basic",
		price: 190000,
		features: ["1 mailbox", "5GB storage", "Basic features", "Standard support"],
	},
	{
		name: "pro",
		price: 490000,
		features: [
			"5 mailboxes",
			"50GB storage",
			"Media upload",
			"Custom domain",
			"Priority support",
		],
		highlighted: true,
	},
	{
		name: "premium",
		price: 990000,
		features: [
			"20 mailboxes",
			"200GB storage",
			"All features",
			"Priority support",
			"AI-powered replies",
			"Advanced analytics",
		],
	},
]

export default function PricingRoute() {
	const navigate = useNavigate()

	return (
		<div className="min-h-screen bg-[#0a1020] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(64,120,255,0.28),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(30,214,160,0.18),transparent_30%),linear-gradient(135deg,#0a1020_0%,#111827_48%,#07111f_100%)]" />
			<div className="relative mx-auto max-w-7xl px-6 py-20">
				<div className="mb-12 text-center">
					<h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
					<p className="mt-3 text-lg text-gray-400">
						Choose the plan that fits your team. All prices in VND, billed monthly.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					{TIERS.map((tier) => (
						<TierCard
							key={tier.name}
							name={tier.name}
							price={tier.price}
							features={tier.features as unknown as string[]}
							highlighted={"highlighted" in tier && tier.highlighted === true}
							onSelect={() => navigate(`/signup`)}
						/>
					))}
				</div>

				<div className="mt-16 text-center">
					<h2 className="text-2xl font-bold">Need a custom plan?</h2>
					<p className="mt-2 text-gray-400">
						Contact us for enterprise solutions with dedicated support and custom integrations.
					</p>
					<Button
						variant="secondary"
						size="base"
						className="mt-4"
						onClick={() => navigate("/")}
					>
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	)
}
