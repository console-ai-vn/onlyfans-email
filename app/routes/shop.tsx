import { Button, Loader } from "@cloudflare/kumo"
import { useState } from "react"
import { useParams, useSearchParams } from "react-router"
import ItemCard from "~/components/ItemCard"
import { useCatalog, usePurchaseItem } from "~/queries/inventory"

export default function ShopRoute() {
	const { creatorMailboxId } = useParams<{ creatorMailboxId?: string }>()
	const [searchParams] = useSearchParams()
	const userEmail = searchParams.get("userEmail") || ""
	const resolvedCreator = creatorMailboxId || searchParams.get("creator") || ""

	const { data: catalogData, isLoading, error } = useCatalog(resolvedCreator || undefined)
	const purchase = usePurchaseItem()

	const [purchasingId, setPurchasingId] = useState<string | null>(null)
	const [purchaseError, setPurchaseError] = useState<string | null>(null)
	const [purchaseSuccess, setPurchaseSuccess] = useState(false)

	const items = catalogData?.items ?? []

	const handlePurchase = async (itemId: string) => {
		if (!userEmail) {
			setPurchaseError("Missing user email. Please login first.")
			return
		}

		setPurchasingId(itemId)
		setPurchaseError(null)
		setPurchaseSuccess(false)

		try {
			await purchase.mutateAsync({ userEmail, itemId })
			setPurchaseSuccess(true)
		} catch (err) {
			setPurchaseError(err instanceof Error ? err.message : "Purchase failed")
		} finally {
			setPurchasingId(null)
		}
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-kumo-recessed">
				<Loader size="lg" />
			</div>
		)
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-kumo-recessed">
				<div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
					<p className="text-red-700">
						{error instanceof Error ? error.message : "Failed to load shop"}
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-kumo-recessed py-12">
			<div className="mx-auto max-w-6xl px-4">
				<div className="mb-8 text-center">
					<h1 className="text-3xl font-bold text-kumo-default">
						{resolvedCreator ? `${resolvedCreator}'s Shop` : "ONYX Shop"}
					</h1>
					<p className="mt-2 text-kumo-subtle">
						Browse and purchase virtual items from creators
					</p>
				</div>

				{purchaseError && (
					<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{purchaseError}
					</div>
				)}

				{purchaseSuccess && (
					<div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
						Purchase successful! The item has been added to your inventory.
					</div>
				)}

				{items.length === 0 ? (
					<div className="rounded-xl border border-kumo-line bg-kumo-base p-12 text-center">
						<p className="text-kumo-subtle">
							{resolvedCreator
								? "This creator has no items available yet."
								: "No items available in the shop yet."}
						</p>
						{!userEmail && (
							<div className="mt-4">
								<Button
									variant="primary"
									size="sm"
									onClick={() => {
										// Navigate to signup/login
										window.location.href = "/signup"
									}}
								>
									Sign Up to Purchase
								</Button>
							</div>
						)}
					</div>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{items.map((item: Record<string, unknown>) => (
							<ItemCard
								key={item.id as string}
								item={{
									id: item.id as string,
									name: item.name as string,
									description: item.description as string,
									price: item.price as number,
									imageUrl: item.imageUrl as string | null,
									type: item.type as string,
								}}
								onPurchase={() => handlePurchase(item.id as string)}
								purchasing={purchasingId === item.id}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
