import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "~/services/api";
import { queryKeys } from "./keys";

export function useAuditLog(
	mailboxId: string | undefined,
	params: Record<string, string>,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: mailboxId
			? queryKeys.audit.list(mailboxId, params)
			: ["audit", "_disabled"],
		queryFn: () => api.listAuditLog(mailboxId!, params),
		enabled: !!mailboxId && (options?.enabled ?? true),
	});
}

export function useRetentionStats(
	mailboxId: string | undefined,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: mailboxId
			? queryKeys.audit.retention(mailboxId)
			: ["retention", "_disabled"],
		queryFn: () => api.getRetentionStats(mailboxId!),
		enabled: !!mailboxId && (options?.enabled ?? true),
	});
}

export function useRunRetention() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			mailboxId,
			policy,
		}: {
			mailboxId: string;
			policy?: { trashDays?: number; sentDays?: number };
		}) => api.runRetention(mailboxId, policy),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.audit.retention(variables.mailboxId),
			});
		},
	});
}