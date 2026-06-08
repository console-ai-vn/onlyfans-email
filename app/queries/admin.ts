import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "~/services/api";
import { queryKeys } from "./keys";

export function useDomainConfig(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.admin.domains,
		queryFn: () => api.getAdminDomains(),
		enabled: options?.enabled ?? true,
	});
}

export function useUpdateDomainConfig() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (config: {
			domains?: string[];
			emailAddresses?: string[];
			accessEmailAddresses?: string[];
		}) => api.updateAdminDomains(config),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.domains });
			queryClient.invalidateQueries({ queryKey: queryKeys.config });
		},
	});
}

export function useMailboxPermissions(mailboxId: string | undefined, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: mailboxId ? queryKeys.admin.permissions(mailboxId) : ["permissions", "_disabled"],
		queryFn: () => api.listMailboxPermissions(mailboxId!),
		enabled: !!mailboxId && (options?.enabled ?? true),
	});
}

export function useGrantMailboxPermission(mailboxId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: { userEmail: string; role: "manager" | "member" | "viewer" }) =>
			api.grantMailboxPermission(mailboxId!, payload),
		onSuccess: () => {
			if (mailboxId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.permissions(mailboxId) });
			}
		},
	});
}

export function useRevokeMailboxPermission(mailboxId: string | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userEmail: string) => api.revokeMailboxPermission(mailboxId!, userEmail),
		onSuccess: () => {
			if (mailboxId) {
				queryClient.invalidateQueries({ queryKey: queryKeys.admin.permissions(mailboxId) });
			}
		},
	});
}

export function useSignupRequests(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.admin.signupRequests,
		queryFn: async () => {
			const data = await api.listSignupRequests();
			return data.requests;
		},
		enabled: options?.enabled ?? true,
	});
}

export function useApproveSignupRequest() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: { requestId: string; adminNote?: string }) =>
			api.approveSignupRequest(payload.requestId, payload.adminNote),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.signupRequests });
			queryClient.invalidateQueries({ queryKey: queryKeys.admin.domains });
			queryClient.invalidateQueries({ queryKey: queryKeys.config });
			queryClient.invalidateQueries({ queryKey: queryKeys.mailboxes.all });
		},
	});
}