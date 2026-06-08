import { useQuery } from "@tanstack/react-query";
import api from "~/services/api";
import type { MemberProfile } from "~/types";

export function useMemberProfile(email: string | undefined, enabled = true) {
	const normalized = email?.trim().toLowerCase();
	return useQuery<MemberProfile>({
		queryKey: ["member-profile", normalized ?? "_disabled"],
		queryFn: () => api.getMemberProfile(normalized!),
		enabled: !!normalized && enabled,
		staleTime: 60_000,
	});
}