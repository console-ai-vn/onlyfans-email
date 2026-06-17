import { Button, Loader } from "@cloudflare/kumo"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import PaymentQR from "~/components/PaymentQR"
import TierCard from "~/components/TierCard"
import { useCheckout, useInvoice } from "~/queries/payments"

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
] as const

export default function CheckoutRoute() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const mailboxId = searchParams.get("mailboxId") || ""

	const [selectedTier, setSelectedTier] = useState<string | null>(null)
	const [invoiceId, setInvoiceId] = useState<string | null>(null)
	const [qrCode, setQrCode] = useState<string | null>(null)
	const [checkoutAmount, setCheckoutAmount] = useState(0)
	const [error, setError] = useState<string | null>(null)

	const checkout = useCheckout()
	const invoiceQuery = useInvoice(invoiceId || "", mailboxId)

	const handleSelectTier = async (tierName: string) => {
		setError(null)
		setSelectedTier(tierName)

		try {
			const result = await checkout.mutateAsync({
				mailboxId,
				tier: tierName,
			})

			setInvoiceId(result.invoice.id)
			setQrCode(result.qrCode)
			setCheckoutAmount(result.amount)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create checkout")
			setSelectedTier(null)
		}
	}

	// Poll for payment confirmation
	const invoice = invoiceQuery.data?.invoice
	const subscription = invoiceQuery.data?.subscription

	if (invoice?.status === "paid" && subscription?.status === "active") {
		navigate("/app", { replace: true })
		return null
	}

	if (!mailboxId) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-kumo-recessed">
				<div className="rounded-xl border border-kumo-line bg-kumo-base p-8 text-center">
					<p className="text-kumo-subtle">Missing mailbox parameter. Please go through the signup flow.</p>
					<Button variant="primary" className="mt-4" onClick={() => navigate("/signup")}>
						Go to Signup
					</Button>
				</div>
			</div>
		)
	}

	if (!qrCode) {
		return (
			<div className="min-h-screen bg-kumo-recessed py-12">
				<div className="mx-auto max-w-4xl px-4">
					<div className="mb-8 text-center">
						<h1 className="text-3xl font-bold text-kumo-default">Choose Your Plan</h1>
						<p className="mt-2 text-kumo-subtle">
							Select the tier that fits your team. Upgrade anytime.
						</p>
					</div>

					{error && (
						<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="grid gap-6 md:grid-cols-3">
						{TIERS.map((tier) => (
							<TierCard
								key={tier.name}
								name={tier.name}
								price={tier.price}
								features={tier.features as unknown as string[]}
								highlighted={"highlighted" in tier && tier.highlighted === true}
								onSelect={() => handleSelectTier(tier.name)}
							/>
						))}
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-kumo-recessed">
			<div className="mx-auto max-w-md px-4 text-center">
				<h1 className="mb-2 text-xl font-bold text-kumo-default">
					Complete Your Payment
				</h1>
				<p className="mb-6 text-sm text-kumo-subtle">
					Scan the QR code with your banking app to activate your{" "}
					<span className="font-semibold capitalize">{selectedTier}</span> plan.
				</p>

				{checkout.isPending ? (
					<div className="flex justify-center py-12">
						<Loader size="lg" />
					</div>
				) : (
					<>
						<PaymentQR
							qrCode={qrCode}
							amount={checkoutAmount}
							description={`ONYX ${selectedTier} subscription for ${mailboxId}`}
							onExpired={() => {
								setQrCode(null)
								setInvoiceId(null)
								setSelectedTier(null)
								setError("QR code expired. Please try again.")
							}}
						/>

						{invoiceQuery.isFetching && (
							<div className="mt-4 flex items-center justify-center gap-2 text-sm text-kumo-subtle">
								<Loader size="sm" />
								<span>Waiting for payment...</span>
							</div>
						)}

						<Button
							variant="secondary"
							size="sm"
							className="mt-4"
							onClick={() => {
								setQrCode(null)
								setInvoiceId(null)
								setSelectedTier(null)
								setError(null)
							}}
						>
							Choose Different Plan
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
