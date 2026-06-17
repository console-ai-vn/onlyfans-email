import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "~/services/api"
import { queryKeys } from "./keys"

export function useCheckout() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ mailboxId, tier }: { mailboxId: string; tier: string }) =>
			api.checkout({ mailboxId, tier }),
		onSuccess: (_data, { mailboxId }) => {
			qc.invalidateQueries({ queryKey: queryKeys.payments.subscription(mailboxId) })
		},
	})
}

export function useInvoice(invoiceId: string, mailboxId: string) {
	return useQuery({
		queryKey: invoiceId
			? queryKeys.payments.invoice(invoiceId)
			: ["payments", "invoice", "_disabled"],
		queryFn: () => api.getInvoice(invoiceId, mailboxId),
		enabled: !!invoiceId && !!mailboxId,
		refetchInterval: 3000, // poll every 3 seconds
	})
}

export function useSubscription(mailboxId: string | undefined) {
	return useQuery({
		queryKey: mailboxId
			? queryKeys.payments.subscription(mailboxId)
			: ["payments", "subscription", "_disabled"],
		queryFn: () => api.getSubscription(mailboxId!),
		enabled: !!mailboxId,
	})
}

export function useCancelSubscription(mailboxId: string) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.cancelSubscription(mailboxId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: queryKeys.payments.subscription(mailboxId) })
			qc.invalidateQueries({ queryKey: queryKeys.payments.invoices(mailboxId) })
		},
	})
}

export function useInvoices(mailboxId: string | undefined) {
	return useQuery({
		queryKey: mailboxId
			? queryKeys.payments.invoices(mailboxId)
			: ["payments", "invoices", "_disabled"],
		queryFn: () => api.getInvoices(mailboxId!),
		enabled: !!mailboxId,
	})
}
