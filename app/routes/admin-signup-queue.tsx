import {
	Badge,
	Button,
	Empty,
	Loader,
	useKumoToastManager,
} from "@cloudflare/kumo";
import { CheckCircleIcon, UserPlusIcon, XCircleIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatListDate } from "shared/dates";
import {
	useApproveSignupRequest,
	useRejectSignupRequest,
	useSignupRequests,
} from "~/queries/admin";
import api from "~/services/api";
import { queryKeys } from "~/queries/keys";

function statusBadge(status: "pending" | "approved" | "rejected") {
	if (status === "approved") return <Badge variant="success">Approved</Badge>;
	if (status === "rejected") return <Badge variant="secondary">Rejected</Badge>;
	return <Badge variant="outline">Pending</Badge>;
}

export default function AdminSignupQueueRoute() {
	const toast = useKumoToastManager();
	const { data: config } = useQuery({
		queryKey: queryKeys.config,
		queryFn: () => api.getConfig(),
	});
	const isAdmin = config?.isAdmin ?? false;
	const { data, isLoading, isFetching } = useSignupRequests({
		enabled: isAdmin,
	});
	const approveRequest = useApproveSignupRequest();
	const rejectRequest = useRejectSignupRequest();
	const [activeId, setActiveId] = useState<string | null>(null);

	const requests = data?.requests ?? [];
	const automationReady = data?.automation?.ready ?? false;
	const pending = useMemo(
		() => requests.filter((entry) => entry.status === "pending"),
		[requests],
	);
	const processed = useMemo(
		() => requests.filter((entry) => entry.status !== "pending"),
		[requests],
	);

	const handleApprove = async (requestId: string) => {
		setActiveId(requestId);
		try {
			const result = await approveRequest.mutateAsync(requestId);
			const detail = result.fullyAutomated
				? "Mailbox + quyền + OTP allowlist xong. User login được luôn."
				: result.accessOtpError ||
					"Mailbox đã tạo. Kiểm tra OTP automation config.";
			toast.add({
				title: result.fullyAutomated ? "Duyệt xong — full auto" : "Duyệt xong — cần check OTP",
				description: detail,
				variant: result.fullyAutomated ? undefined : "error",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Không duyệt được";
			toast.add({ title: message, variant: "error" });
		} finally {
			setActiveId(null);
		}
	};

	const handleReject = async (requestId: string) => {
		setActiveId(requestId);
		try {
			await rejectRequest.mutateAsync(requestId);
			toast.add({ title: "Đã từ chối" });
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Không từ chối được";
			toast.add({ title: message, variant: "error" });
		} finally {
			setActiveId(null);
		}
	};

	if (!config) {
		return (
			<div className="flex justify-center py-20">
				<Loader size="lg" />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className="max-w-2xl px-4 py-8 md:px-8">
				<Empty
					icon={<UserPlusIcon size={48} className="text-kumo-inactive" />}
					title="Admin only"
					description="Signup queue requires ACCESS_EMAIL_ADDRESSES membership."
				/>
			</div>
		);
	}

	return (
		<div className="max-w-3xl px-4 py-8 md:px-8 space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-xl font-semibold text-kumo-default">Duyệt đăng ký</h1>
				{automationReady ? (
					<Badge variant="success">Full auto</Badge>
				) : (
					<Badge variant="outline">OTP chưa config</Badge>
				)}
				{isFetching && !isLoading && <Loader size="sm" />}
			</div>

			{isLoading ? (
				<div className="flex justify-center py-16">
					<Loader />
				</div>
			) : pending.length === 0 ? (
				<Empty
					icon={<UserPlusIcon size={48} className="text-kumo-inactive" />}
					title="Không có request chờ"
					description="Form start.vsbg.vn sẽ hiện ở đây khi có người đăng ký."
				/>
			) : (
				<div className="space-y-3">
					{pending.map((entry) => {
						const busy = activeId === entry.id;
						return (
							<article
								key={entry.id}
								className="rounded-xl border border-kumo-line bg-kumo-base p-4 shadow-sm"
							>
								<div className="flex flex-wrap items-start justify-between gap-3">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="text-lg font-semibold text-kumo-default">
												{entry.displayName}
											</h2>
											{statusBadge(entry.status)}
										</div>
										<p className="mt-1 text-xs text-kumo-subtle">
											{formatListDate(entry.createdAt)}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="secondary"
											size="sm"
											icon={<XCircleIcon size={16} />}
											loading={busy && rejectRequest.isPending}
											disabled={busy}
											onClick={() => void handleReject(entry.id)}
										>
											Từ chối
										</Button>
										<Button
											variant="primary"
											size="sm"
											icon={<CheckCircleIcon size={16} />}
											loading={busy && approveRequest.isPending}
											disabled={busy}
											onClick={() => void handleApprove(entry.id)}
										>
											Duyệt
										</Button>
									</div>
								</div>
								<dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
									<div className="rounded-lg bg-kumo-recessed px-3 py-2">
										<dt className="text-xs uppercase tracking-wide text-kumo-subtle">
											Mailbox
										</dt>
										<dd className="mt-1 font-semibold text-kumo-default">
											{entry.desiredMailbox}
										</dd>
									</div>
									<div className="rounded-lg bg-kumo-recessed px-3 py-2">
										<dt className="text-xs uppercase tracking-wide text-kumo-subtle">
											OTP email
										</dt>
										<dd className="mt-1 font-semibold text-kumo-default">
											{entry.personalEmail}
										</dd>
									</div>
								</dl>
								{entry.note && (
									<p className="mt-3 text-sm text-kumo-strong">{entry.note}</p>
								)}
							</article>
						);
					})}
				</div>
			)}

			{processed.length > 0 && (
				<details className="rounded-xl border border-kumo-line bg-kumo-base">
					<summary className="cursor-pointer px-4 py-3 text-sm font-medium text-kumo-default">
						Đã xử lý ({processed.length})
					</summary>
					<ul className="divide-y divide-kumo-line border-t border-kumo-line">
						{processed.map((entry) => (
							<li key={entry.id} className="px-4 py-3 text-sm">
								<div className="flex flex-wrap items-center gap-2">
									<span className="font-medium">{entry.displayName}</span>
									{statusBadge(entry.status)}
								</div>
								<div className="mt-1 text-kumo-subtle">
									{entry.desiredMailbox} · {entry.personalEmail}
								</div>
							</li>
						))}
					</ul>
				</details>
			)}
		</div>
	);
}